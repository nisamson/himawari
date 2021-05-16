use chrono::Utc;
use sqlx::{PgPool, Row};
use crate::db;
use actix_web::ResponseError;
use actix_web::web::BytesMut;
use actix_web::http::StatusCode;
use actix_web::body::Body;
use std::fmt;
use std::fmt::Formatter;
use serde::{Serialize, Serializer, Deserialize, Deserializer};
use std::convert::TryFrom;
use std::error::Error;
use serde::de::Error as SError;

// Assumptions about data:
// Username and display name are public knowledge
// Everything else is *not*

pub trait User {
    fn username(&self) -> &str;
}

pub trait LoginUser: User {
    fn password(&self) -> &str;
}

pub trait CreateUser: LoginUser {
    fn email(&self) -> &str;
}

#[derive(shrinkwraprs::Shrinkwrap, Clone, PartialEq, Hash, Eq)]
pub struct Password(String);

impl Serialize for Password {
    fn serialize<S>(&self, serializer: S) -> Result<<S as Serializer>::Ok, <S as Serializer>::Error> where
        S: Serializer {
        serializer.serialize_str(&self.0)
    }
}

impl<'de> Deserialize<'de> for Password {
    fn deserialize<D>(deserializer: D) -> Result<Self, <D as Deserializer<'de>>::Error> where
        D: Deserializer<'de> {
        let s = String::deserialize(deserializer)?;
        Password::try_from(s).map_err(D::Error::custom)
    }
}

#[derive(Debug)]
pub struct BadPassword;

impl fmt::Display for BadPassword {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str("Password must be between 4 and 128 characters, inclusive.")
    }
}

impl Error for BadPassword {}

impl ResponseError for BadPassword {
    fn status_code(&self) -> StatusCode {
        StatusCode::BAD_REQUEST
    }
}

impl TryFrom<String> for Password {
    type Error = BadPassword;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        if !(4usize..=128).contains(&value.len()) {
            return Err(BadPassword);
        }

        Ok(Password(value))
    }
}

impl fmt::Debug for Password {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.debug_tuple("Password")
            .field(&"<omitted>")
            .finish()
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserRef {
    pub username: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    #[serde(flatten)]
    pub user: UserRef,
    pub password: Password,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreationRequest {
    #[serde(flatten)]
    pub user: LoginRequest,
    pub email: String,
}

impl User for UserRef {
    fn username(&self) -> &str {
        self.username.as_str()
    }
}

impl User for LoginRequest {
    fn username(&self) -> &str {
        self.user.username()
    }
}

impl LoginUser for LoginRequest {
    fn password(&self) -> &str {
        self.password.as_str()
    }
}

impl CreateUser for CreationRequest {
    fn email(&self) -> &str {
        self.email.as_str()
    }
}

impl LoginUser for CreationRequest {
    fn password(&self) -> &str {
        self.user.password()
    }
}

impl User for CreationRequest {
    fn username(&self) -> &str {
        self.user.username()
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[derive(sqlx::FromRow)]
pub struct StoredUser {
    pub email: String,
    pub email_verified: bool,
    username: String,
    pub display_name: String,
    pub hash: String,
    created: chrono::DateTime<Utc>,
}

impl StoredUser {
    pub fn email(&self) -> &str {
        &self.email
    }
    pub fn email_verified(&self) -> bool {
        self.email_verified
    }
    pub fn display_name(&self) -> &str {
        &self.display_name
    }
    pub fn hash(&self) -> &str {
        &self.hash
    }
    pub fn created(&self) -> chrono::DateTime<Utc> {
        self.created
    }
}

impl User for StoredUser {
    fn username(&self) -> &str {
        self.username.as_str()
    }
}

impl StoredUser {
    pub fn new(username: String, email: String, hash: String) -> Self {
        let display_name = username.clone();
        Self {
            email,
            email_verified: false,
            username,
            display_name,
            hash,
            created: chrono::DateTime::from(chrono::Local::now()),
        }
    }

    pub async fn store_new(&self, db: &PgPool) -> Result<(), db::Error> {
        sqlx::query!(
            r#"
            INSERT INTO users (username, display_name, email, email_verified, hash, created)
             VALUES ($1, $2, $3::TEXT::CITEXT, $4, $5, $6);
            "#,
            self.username(),
            &self.display_name,
            &self.email,
            self.email_verified,
            &self.hash,
            &self.created
        ).execute(db)
            .await?;
        Ok(())
    }

    pub async fn find_user(username: &str, db: &PgPool) -> Result<Self, db::Error> {
        Ok(sqlx::query_as!(
                    StoredUser,
                    r#"
                    SELECT username, display_name, email::text as "email!", email_verified, hash, created
                    FROM users
                    WHERE username = $1;
                    "#,
                    username
                ).fetch_one(db)
            .await?)
    }
}

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum CreateError {
    #[error("Password must be between 4 and 128 characters/bytes, inclusive.")]
    BadPasswordLen,
    #[error("A database error occurred")]
    Db(#[from] db::Error),
}

impl ResponseError for CreateError {
    fn status_code(&self) -> StatusCode {
        match self {
            CreateError::BadPasswordLen => { StatusCode::BAD_REQUEST }
            CreateError::Db(e) => { e.status_code() }
        }
    }
}

impl CreationRequest {
    pub fn new(username: String, password: Password, email: String) -> Self {
        Self {
            user: LoginRequest::new(username, password),
            email,
        }
    }

    pub async fn create_user(&self, db: &PgPool) -> Result<StoredUser, CreateError> {
        let hash = db::hash_password(self.user.password.clone()).await;
        let user = StoredUser::new(self.username().to_string(),
                                   self.email.to_string(),
            hash
        );
        user.store_new(db).await?;
        Ok(user)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum LoginError {
    #[error("Username or password wasn't valid")]
    Failed,
    #[error("DB error occurred")]
    Db(#[from] db::Error)
}

impl ResponseError for LoginError {
    fn status_code(&self) -> StatusCode {
        match self {
            LoginError::Failed => {StatusCode::UNAUTHORIZED}
            LoginError::Db(d) => {d.status_code()}
        }
    }
}

impl LoginRequest {
    pub fn new(username: String, password: Password) -> Self {
        Self {
            user: UserRef { username },
            password
        }
    }

    pub async fn log_in(&self, db: &PgPool) -> Result<StoredUser, LoginError> {
        let user = StoredUser::find_user(self.username(), db).await;

        if let Err(db::Error::NoSuchRow) = &user {
            return Err(LoginError::Failed);
        } else if user.is_err() {
            return Err(user.unwrap_err().into());
        }

        let user = user.unwrap();

        if db::PassCheck::Failed == db::verify_password(self.password.clone(),
                                                        user.hash.clone()).await {
            return Err(LoginError::Failed);
        }
        Ok(user)
    }
}