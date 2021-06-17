use std::fmt::{Debug, Formatter};
use std::fmt;

use rocket::response::{content, status};
use rocket::serde::json;
use validator::Validate;

use argon2::password_hash::{SaltString, Error};
use once_cell::sync::Lazy;
use argon2::{Argon2, PasswordHasher, PasswordVerifier, PasswordHash};
use crate::{
    api::need_env_var,
    model::{
        users::{NewUserRequest, Password, LoginRequest, User},
        users,
    },
    api,
    recaptcha,
    db,
};
use secrecy::{SecretString, ExposeSecret};
use rocket::http::Status;
use jwt_simple::prelude::{HS256Key, Claims, Duration, MACLike, VerificationOptions};
use std::convert::TryFrom;
use rocket::request::{FromRequest, Outcome};
use rocket::Request;
use rocket::http::hyper::header::AUTHORIZATION;
use crate::api::ResponseError;
use std::borrow::Cow;
use crate::model::users::Info;
use crate::logging::RequestId;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Token {
    token: String,
}

impl AsRef<str> for Token {
    fn as_ref(&self) -> &str {
        self.token.as_ref()
    }
}

static JWT_KEY: Lazy<HS256Key> = Lazy::new(|| {
    HS256Key::from_bytes(need_env_var("JWT_KEY").as_ref())
});

impl TryFrom<users::Info> for Token {
    type Error = api::Error;

    fn try_from(user: users::Info) -> Result<Self, Self::Error> {
        let claims = Claims::with_custom_claims(user, Duration::from_days(7));
        Ok(Token {
            token: JWT_KEY.authenticate(claims).map_err(api::Error::from_error)?
        })
    }
}

impl<'s> TryFrom<&'s str> for users::Info {
    type Error = api::Error;

    fn try_from(s: &'s str) -> Result<Self, Self::Error> {
        let opts = VerificationOptions {
            max_validity: Some(Duration::from_days(7)),
            ..Default::default()
        };

        let claims = JWT_KEY.verify_token(s, Some(opts))
            .map_err(|e| {info!("JWT verification failed: {}", e); Status::Unauthorized})?;
        Ok(claims.custom)
    }
}

#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum TokenFailure {
    Malformed,
    Missing,
}

impl ResponseError for TokenFailure {
    fn status(&self) -> Status {
        Status::Unauthorized
    }

    fn message(&self) -> Cow<'static, str> {
        match self {
            TokenFailure::Malformed => {"Token was malformed"}
            TokenFailure::Missing => {"No token found"}
        }.into()
    }
}

#[async_trait::async_trait]
impl<'r> FromRequest<'r> for users::Info {
    type Error = api::Error;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let req = request.guard::<RequestId>().await.unwrap();
        let span = info_span!("parsing JWT", id=%req);
        span.in_scope(|| {
            let res = request.headers().get_one(AUTHORIZATION.as_str())
                .ok_or_else(|| {info!("missing auth header"); TokenFailure::Missing.into()})
                .and_then(|s|
                    {
                        if !s.starts_with("Bearer:") {
                            info!("not a bearer header");
                            return Err(TokenFailure::Malformed.into())
                        }
                        Ok(s[7..].trim())
                    })
                .and_then(users::Info::try_from);

            match res {
                Ok(inf) => {Outcome::Success(inf)}
                Err(e) => {
                    Outcome::Failure((e.as_inner().status(), e))
                }
            }
        })
    }
}


#[rocket::post("/register", format = "json", data = "<registration>")]
#[instrument(level = "info", skip(registration), fields(user = % registration.username))]
pub async fn register(id: RequestId, registration: json::Json<NewUserRequest>) -> api::Result<Status> {
    info!("registration attempt");
    let NewUserRequest { username, password, email, captcha_token } = registration.0;
    recaptcha::verify_captcha(captcha_token).await?;
    let pass_hash = hash_password(password).await?;

    sqlx::query!(
        r#"INSERT INTO users (username, display_name, email, hash)
            VALUES ($1, $2, $3::TEXT::CITEXT, $4);"#,
        username.as_ref(),
        username.as_ref(),
        email.as_ref(),
        pass_hash
    ).execute(db::pool()).await?;

    Ok(Status::Created)
}

#[rocket::post("/login", format = "json", data = "<login>")]
#[instrument(level = "info", skip(login), fields(user = % login.username))]
pub async fn login(id: RequestId, login: json::Json<LoginRequest>) -> api::Result<json::Json<Token>> {
    info!("login attempt");
    let LoginRequest { password, username } = login.0;
    let user = User::load_full(&username).await?;

    let verified = verify_password(password, user.hash().to_string())
        .await?;

    match verified {
        Verification::Failed => {
            Err(Status::Unauthorized.into())
        }
        Verification::Passed => {
            Ok(json::Json(Token::try_from(users::Info::from(user))?))
        }
    }
}

static HASH_KEY: Lazy<secrecy::SecretString> = Lazy::new(|| SecretString::new(need_env_var("HASH_KEY")));
static ARGON_CONTEXT: Lazy<Argon2> = Lazy::new(|| {
    Argon2::new(
        Some(HASH_KEY.expose_secret().as_ref()),
        1,
        37,
        1,
        argon2::Version::V0x13,
    ).expect("Failed to initialize argon hashing.")
});

static MAX_CONCURRENT_HASHES: tokio::sync::Semaphore = tokio::sync::Semaphore::const_new(8);

pub async fn hash_password(pass: Password) -> api::Result<String> {
    let _permit = MAX_CONCURRENT_HASHES.acquire().await.map_err(api::Error::from_error)?;
    let hash = tokio::task::spawn_blocking(move || {
        let salt = SaltString::generate(rand::thread_rng());
        ARGON_CONTEXT.hash_password_simple(pass.expose().as_ref(), &salt).map(|h| h.to_string())
    }).await
        .map_err(api::Error::from_error)?
        .map_err(api::Error::from_error)?;
    Ok(hash)
}

#[derive(Debug, Copy, Clone, Hash, PartialEq, Eq)]
pub enum Verification {
    Failed,
    Passed,
}

pub async fn verify_password(pass: Password, hash: String) -> api::Result<Verification> {
    let _permit = MAX_CONCURRENT_HASHES.acquire().await.map_err(api::Error::from_error)?;
    let res = tokio::task::spawn_blocking(move || {
        let parsed_hash = PasswordHash::new(&hash)?;
        ARGON_CONTEXT.verify_password(pass.expose().as_ref(), &parsed_hash)
    }).await
        .map_err(api::Error::from_error)?;

    if let Err(e) = res {
        if let argon2::password_hash::Error::Password = &e {
            Ok(Verification::Failed)
        } else {
            Err(api::Error::from_error(e))
        }
    } else {
        Ok(Verification::Passed)
    }
}