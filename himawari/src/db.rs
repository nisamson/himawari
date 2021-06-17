use tokio::sync::OnceCell;
use crate::api;
use once_cell::sync::Lazy;
use sqlx::error::{DatabaseError, BoxDynError};
use crate::api::ResponseError;
use rocket::http::Status;
use std::borrow::Cow;
use sqlx::migrate::Migrator;
use unicase::UniCase;
use validator::{ValidationErrors, HasLen};
use sqlx::{Database, Postgres, Type};
use sqlx::postgres::PgTypeInfo;
use std::fmt;
use std::fmt::Formatter;
use sqlx::database::{HasValueRef, HasArguments};
use sqlx::encode::IsNull;
use std::option::Option::None;

static MIGRATIONS: Migrator = sqlx::migrate!("./migrations");

static POOL: Lazy<sqlx::PgPool> = Lazy::new(|| {
    let url = std::env::var("DATABASE_URL").expect("DATABASE_URL needs to be set.");
    sqlx::PgPool::connect_lazy(&url).expect("Invalid DATABASE_URL")
});

pub fn pool() -> &'static sqlx::PgPool {
    &POOL
}

pub async fn run_migrations() -> api::Result<()> {
    MIGRATIONS.run(pool()).await.map_err(api::Error::from_error)
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("SQL error: {0}")]
    Internal(#[source] sqlx::Error),
    #[error("Request violated unique constraint.")]
    Conflict,
    #[error("Not found.")]
    NotFound,
    #[error("Something was bad in the request.")]
    ConstraintViolated
}

impl From<sqlx::Error> for Error {
    fn from(e: sqlx::Error) -> Self {
        trace!("{}", &e);
        match &e {
            sqlx::Error::Database(db) => {
                let code = db.code();

                if let Some(code) = code {
                    if code == "23505" {
                        Error::Conflict
                    } else if code.starts_with("23") {
                        Error::ConstraintViolated
                    } else {
                        Error::Internal(e)
                    }
                } else {
                    Error::Internal(e)
                }
            }
            sqlx::Error::RowNotFound => Error::NotFound,
            _ => Error::Internal(e)
        }
    }
}

impl ResponseError for Error {
    fn status(&self) -> Status {
        match self {
            Error::Internal(_) => {Status::InternalServerError}
            Error::Conflict => {Status::Conflict}
            Error::NotFound => {Status::NotFound}
            Error::ConstraintViolated => {Status::BadRequest}
        }
    }

    fn message(&self) -> Cow<'static, str> {
        self.to_string().into()
    }
}

#[derive(shrinkwraprs::Shrinkwrap, Debug, Clone, Ord, PartialOrd, Eq, PartialEq, Hash)]
pub struct CiText(UniCase<String>);

impl From<String> for CiText {
    fn from(s: String) -> Self {
        Self(s.into())
    }
}

impl Into<String> for CiText {
    fn into(self) -> String {
        self.0.into()
    }
}

impl<'a> Into<Cow<'a, str>> for CiText {
    fn into(self) -> Cow<'a, str> {
        Cow::Owned(self.into())
    }
}

impl fmt::Display for CiText {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_ref())
    }
}

impl HasLen for CiText {
    fn length(&self) -> u64 {
        self.0.len() as u64
    }
}

impl sqlx::Type<Postgres> for CiText {
    fn type_info() -> <Postgres as Database>::TypeInfo {
        PgTypeInfo::with_name("citext")
    }
}

impl<'r> sqlx::Decode<'r, Postgres> for CiText {
    fn decode(value: <Postgres as HasValueRef<'r>>::ValueRef) -> std::result::Result<Self, BoxDynError> {
        let s = <String as sqlx::Decode<Postgres>>::decode(value)?;
        Ok(s.into())
    }
}

impl<'q> sqlx::Encode<'q, Postgres> for CiText {
    fn encode(self, buf: &mut <Postgres as HasArguments<'q>>::ArgumentBuffer) -> IsNull where
        Self: Sized, {
        <String as sqlx::Encode<Postgres>>::encode(self.0.into_inner(), buf)
    }

    fn encode_by_ref(&self, buf: &mut <Postgres as HasArguments<'q>>::ArgumentBuffer) -> IsNull {
        <&str as sqlx::Encode<Postgres>>::encode(self.0.as_str(), buf)
    }

    fn produces(&self) -> Option<<Postgres as Database>::TypeInfo> {
        Some(Self::type_info())
    }

    fn size_hint(&self) -> usize {
        self.0.len()
    }
}

impl From<sqlx::Error> for api::Error {
    fn from(s: sqlx::Error) -> Self {
        let e: Error = s.into();
        e.into()
    }
}

pub type Result<T> = std::result::Result<T, Error>;