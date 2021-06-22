use std::fmt::{Debug, Formatter};
use std::fmt;

use validator::{Validate, ValidationErrors};
use std::convert::{TryFrom, TryInto};
use crate::db::CiText;
use crate::{db, api};
use sqlx::{
    Error,
    Postgres,
    Row,
    types::chrono::Utc,
    types::chrono,
    postgres::PgRow
};
use crate::model::contests::Contest;
use super::ItemId;

#[derive(Deserialize, Validate, Clone)]
#[serde(try_from = "String")]
pub struct Password {
    #[validate(length(min = 4, max = 128))]
    password: String,
}

#[derive(Deserialize, Serialize, Clone, Debug, PartialEq, Eq, PartialOrd, Ord, shrinkwraprs::Shrinkwrap, sqlx::Type)]
#[sqlx(transparent)]
#[serde(try_from = "String")]
pub struct Username(String);

serde_plain::forward_display_to_serde!(Username);

#[derive(Deserialize, Serialize, Clone, Debug, shrinkwraprs::Shrinkwrap)]
#[serde(try_from = "String", into = "String")]
pub struct Email {
    email: CiText,
}

impl Validate for Email {
    fn validate(&self) -> Result<(), ValidationErrors> {
        use validator::*;

        #[derive(Validate)]
        struct Anon<'r> {
            #[validate(length(min = 1, max = 128), non_control_character, email)]
            email: &'r str,
        }

        Anon {
            email: self.as_ref()
        }.validate()
    }
}

serde_plain::forward_display_to_serde!(Email);

impl Password {
    pub fn new(s: String) -> Result<Self, ValidationErrors> {
        let out = Self { password: s };
        out.validate()?;
        Ok(out)
    }
    pub fn expose(&self) -> &str {
        &self.password
    }
    pub fn expose_into(self) -> String { self.password }
}


impl TryFrom<String> for Password {
    type Error = ValidationErrors;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        Self::new(value)
    }
}

impl TryFrom<String> for Email {
    type Error = ValidationErrors;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let out = Self {
            email: value.into()
        };

        out.validate()?;
        Ok(out)
    }
}

impl Into<CiText> for Email {
    fn into(self) -> CiText {
        self.email
    }
}

impl Into<String> for Email {
    fn into(self) -> String {
        self.email.into()
    }
}

impl Into<String> for Username {
    fn into(self) -> String {
        self.0.into()
    }
}

impl TryFrom<String> for Username {
    type Error = ValidationErrors;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let out = Self(value);

        #[derive(Validate)]
        struct Anon<'r> {
            #[validate(length(min = 1, max = 128), non_control_character)]
            username: &'r str
        }

        Anon {username: out.0.as_str() }.validate()?;
        Ok(out)
    }
}

impl Debug for Password {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.write_str("<password>")
    }
}

#[derive(Deserialize, Debug, Clone)]
pub struct NewUserRequest {
    pub username: Username,
    pub password: Password,
    pub email: Email,
    #[serde(rename = "captchaToken")]
    pub captcha_token: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct LoginRequest {
    pub username: Username,
    pub password: Password,
}

#[derive(Debug, Clone)]
pub struct User {
    username: Username,
    display_name: Username,
    email: Email,
    email_validated: bool,
    hash: String,
    created: chrono::DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct RawUser {
    username: String,
    display_name: String,
    email: String,
    email_validated: bool,
    hash: String,
    created: chrono::DateTime<Utc>,
}

impl TryFrom<RawUser> for User {
    type Error = api::Error;
    fn try_from(u: RawUser) -> Result<Self, Self::Error> {
        Ok(Self {
            username: Username::try_from(u.username)?,
            display_name: Username::try_from(u.display_name)?,
            email: Email::try_from(u.email)?,
            email_validated: u.email_validated,
            hash: u.hash,
            created: u.created,
        })
    }
}

impl User {
    pub async fn load_full(user: &Username) -> api::Result<Self> {
        Ok(sqlx::query_as!(RawUser,
                    r#"SELECT username,
                              display_name,
                              email::TEXT as "email!", email_validated, hash, created
                       FROM users
                       WHERE username = $1"#,
                    user.as_str()
                ).fetch_one(db::pool()).await?.try_into()?)
    }
    pub fn username(&self) -> &Username {
        &self.username
    }
    pub fn display_name(&self) -> &Username {
        &self.display_name
    }
    pub fn email(&self) -> &Email {
        &self.email
    }
    pub fn email_validated(&self) -> bool {
        self.email_validated
    }
    pub fn hash(&self) -> &str {
        &self.hash
    }
    pub fn created(&self) -> chrono::DateTime<Utc> {
        self.created
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Info {
    pub username: Username,
    #[serde(rename = "displayName")]
    pub display_name: Username,
    pub email: Email,
    pub created: chrono::DateTime<Utc>,
}

impl fmt::Debug for Info {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        f.debug_struct("Info")
            .field("username", &self.username.as_str())
            .finish()
            // .finish_non_exhaustive() // switch to this when it's
    }
}

impl fmt::Display for Info {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        let s = serde_json::to_string(self).map_err(|_| fmt::Error::default())?;
        f.write_str(&s)
    }
}

impl From<User> for Info {
    fn from(u: User) -> Self {
        Self {
            username: u.username,
            display_name: u.display_name,
            email: u.email,
            created: u.created,
        }
    }
}

impl Info {
    pub async fn contests(&self) -> api::Result<Vec<Contest>> {
        sqlx::query_as!(
            Contest,
            r#"
            SELECT id as "id!: ItemId", owner as "owner!: Username", name as "name!", created as "created!" FROM user_contests($1) ORDER BY id DESC;
            "#,
            self.username.as_str()
        ).fetch_all(db::pool())
            .await
            .map_err(api::Error::from)
    }
}