use hmac::{Hmac, NewMac};
use sha2::{Sha512, Sha256};
use crate::model::users::UserRef;
use actix_identity::IdentityPolicy;
use actix_web::dev::{ServiceResponse, ServiceRequest};
use std::future::{Future, Ready};
use std::rc::Rc;
use jwt::{Header, AlgorithmType, Token, VerifyWithKey};
use actix_web::{ResponseError, HttpMessage};
use actix_http::http::StatusCode;
use actix_web::cookie::{SameSite, Cookie};
use std::future::ready;
use jwt::SignWithKey;
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub user: UserRef,
    pub exp: chrono::DateTime<Utc>
}

impl Claims {
    fn new(user: UserRef) -> Self {
        Self {
            user,
            exp: chrono::DateTime::from(chrono::Local::now()) + chrono::Duration::weeks(4)
        }
    }
}

impl Claims {
    pub fn expired(&self) -> bool {
        self.exp >= chrono::DateTime::<Utc>::from(chrono::Local::now())
    }
}

pub struct PolicyInner {
    key: Hmac<Sha256>,
    cookie_factory: CookieFactory,
}

impl PolicyInner {
    pub fn new(key: Hmac<Sha256>, cookie_factory: CookieFactory) -> Self {
        PolicyInner { key, cookie_factory }
    }
}

#[derive(shrinkwraprs::Shrinkwrap)]
pub struct Policy {
    policy: Rc<PolicyInner>,
}

impl Policy {
    pub fn new(key: impl AsRef<[u8]>, cookie_factory: CookieFactory) -> Self {
        let hash = Hmac::new_varkey(key.as_ref()).unwrap();
        Self { policy: Rc::new(PolicyInner::new(hash, cookie_factory)) }
    }
}

#[derive(Debug, Clone)]
pub struct CookieFactory {
    pub name: String,
    pub domain: String,
    pub same_site: SameSite,
    pub max_age: chrono::Duration,
    pub http_only: bool,
    pub secure: bool,
}

impl CookieFactory {
    pub fn make_cookie(&self, value: impl Into<String>) -> Cookie {
        Cookie::build(&self.name, value.into())
            .max_age(time::Duration::new(self.max_age.num_seconds(),
                                         self.max_age.num_nanoseconds().unwrap() as i32))
            .domain(&self.domain)
            .http_only(self.http_only)
            .secure(self.secure)
            .finish()
    }

    pub fn make_expiry(&self) -> Cookie {
        Cookie::build(&self.name, "")
            .expires(time::OffsetDateTime::unix_epoch())
            .finish()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("The JWT appears to have been tampered with or corrupted.")]
    TokenTampered,
    #[error("Token expired")]
    TokenExpired,
    #[error("Malformed claims: {0}")]
    BadClaims(#[from] serde_json::Error),
    #[error("Token error")]
    TokenFailure(#[from] jwt::Error)
}

impl ResponseError for Error {
    fn status_code(&self) -> StatusCode {
        match self {
            Error::TokenTampered | Error::TokenFailure(jwt::Error::InvalidSignature) => { StatusCode::UNAUTHORIZED }
            _ => StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

impl Policy {
    fn to_response_inner<B>(&self, identity: Option<String>, changed: bool, response: &mut ServiceResponse<B>) -> Result<(), Error> {
        if changed {
            if let Some(id) = identity {
                let user = UserRef { username: id };
                let claims = Claims::new(user);
                let cookie_val = claims.sign_with_key(&self.key)?;
                response.response_mut().add_cookie(&self.cookie_factory.make_cookie(cookie_val)).unwrap();
            } else {
                response.response_mut().add_cookie(&self.cookie_factory.make_expiry()).unwrap();
            }
        }
        Ok(())
    }

    fn from_request_inner(&self, req: &mut ServiceRequest) -> Result<Option<String>, Error> {
        let inner = req.cookie(&self.cookie_factory.name);
        if inner.is_none() {
            return Ok(None);
        }

        let c = inner.unwrap();
        let raw = c.value();
        let token: Token<Header, Claims, _> = raw.verify_with_key(&self.key).map_err(|e| Error::TokenTampered)?;
        let claims = token.claims();
        if claims.expired() {
            return Err(Error::TokenExpired);
        }

        Ok(serde_json::to_string(claims).ok())
    }
}

impl IdentityPolicy for Policy {
    type Future = Ready<Result<Option<String>, actix_http::Error>>;
    type ResponseFuture = Ready<Result<(), actix_http::Error>>;

    fn from_request(&self, req: &mut ServiceRequest) -> Self::Future {
        ready(self.from_request_inner(req).map_err(actix_http::Error::from))
    }

    fn to_response<B>(&self, identity: Option<String>, changed: bool, response: &mut ServiceResponse<B>) -> Self::ResponseFuture {
        ready(self.to_response_inner(identity, changed, response).map_err(actix_http::Error::from))
    }
}