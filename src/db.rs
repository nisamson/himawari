use sqlx::PgPool;
use actix_web::ResponseError;
use actix_web::web::BytesMut;
use actix_web::http::StatusCode;
use actix_web::body::Body;
use argonautica::{Hasher, Verifier};
use crate::model::users::Password;
use tokio::sync::OnceCell;
use once_cell::sync::Lazy;

pub async fn pool() -> &'static PgPool {
    static DB_POOL: OnceCell<PgPool> = OnceCell::const_new();
    DB_POOL.get_or_init(|| async {
        let conn_uri = std::env::var("DATABASE_URL").expect("DATABASE_URL needs to be set.");
        PgPool::connect(&conn_uri).await.expect("Failed while setting up DB connection")
    }).await
}

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum Error {
    #[error("An internal error occurred")]
    Internal,
    #[error("A conflict occurred while processing that request: {0}")]
    Constraint(String),
    #[error("Unique constraint violated")]
    Unique,
    #[error("No such row exists")]
    NoSuchRow,
}

impl From<sqlx::Error> for Error {
    fn from(e: sqlx::Error) -> Self {
        match &e {
            sqlx::Error::Database(d) => {
                if let Some(code) = d.code() {
                    if "23505" == code {
                        Error::Unique
                    } else if code.starts_with("23") {
                        if let Some(constraint) = d.constraint() {
                            Error::Constraint(constraint.to_string())
                        } else {
                            error!("{}", e);
                            Error::Internal
                        }
                    } else {
                        error!("{}", e);
                        Error::Internal
                    }
                } else {
                    error!("{}", e);
                    Error::Internal
                }
            },
            sqlx::Error::RowNotFound => {
                Error::NoSuchRow
            }
            _ => {
                error!("{}", e);
                Error::Internal
            }
        }
    }
}

impl ResponseError for Error {
    fn status_code(&self) -> StatusCode {
        match self {
            Error::Internal => {StatusCode::INTERNAL_SERVER_ERROR}
            Error::Constraint(_) => {StatusCode::CONFLICT}
            Error::Unique => {StatusCode::CONFLICT}
            Error::NoSuchRow => {StatusCode::NOT_FOUND}
        }
    }
}

static SECRET_KEY: Lazy<String> = Lazy::new(|| {
    std::env::var("HASH_KEY").unwrap()
});

pub async fn hash_password(pass: Password) -> String {
    tokio::task::spawn_blocking(move ||
        Hasher::default().with_secret_key(SECRET_KEY.as_bytes())
            .with_password(pass.as_str())
            .hash()
    ).await.unwrap().expect("Something is wrong with the password hashing crate")
}

#[derive(Copy, Clone, PartialEq)]
pub enum PassCheck {
    Ok,
    Failed
}

pub async fn verify_password(pass: Password, hash: String) -> PassCheck {
    let is_valid = tokio::task::spawn_blocking(move || {
        Verifier::default()
            .with_hash(hash)
            .with_password(pass.as_str())
            .with_secret_key(SECRET_KEY.as_bytes())
            .verify()
    }).await.unwrap().expect("Something is wrong with the password hashing crate");

    if is_valid {
        PassCheck::Ok
    } else {
        PassCheck::Failed
    }
}