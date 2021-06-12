use std::fmt::{Debug, Formatter};
use std::fmt;

use rocket::response::{content, status};
use rocket::serde::json;
use validator::Validate;

use crate::{api, recaptcha};
use crate::model::users::{NewUserRequest, Password};
use argon2::password_hash::{SaltString, Error};
use once_cell::sync::Lazy;
use argon2::{Argon2, PasswordHasher, PasswordVerifier, PasswordHash};
use crate::api::need_env_var;
use secrecy::{SecretString, ExposeSecret};
use reqwest::Version;
use rocket::http::Status;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Token {
    token: String,
}

#[rocket::post("/register", data = "<registration>")]
#[instrument(level = "info")]
pub async fn register(registration: json::Json<NewUserRequest>) -> api::Result<Status> {
    info!("registration attempt");
    let NewUserRequest { username, password, email, captcha_token } = registration.0;
    recaptcha::verify_captcha(captcha_token).await?;
    let pass_hash = hash_password(password).await?;

    Ok(Status::Created)
}

static HASH_KEY: Lazy<secrecy::SecretString> = Lazy::new(|| SecretString::new(need_env_var("HASH_KEY")));
static ARGON_CONTEXT: Lazy<Argon2> = Lazy::new(|| {
    Argon2::new(
        Some(HASH_KEY.expose_secret().as_ref()),
        1,
        37,
        1,
        argon2::Version::V0x13
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
    Failed, Passed
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