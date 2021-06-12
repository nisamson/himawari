use std::fmt::{Debug, Formatter};
use std::fmt;

use validator::{Validate, ValidationErrors};
use std::convert::TryFrom;
use crate::db::CiText;
use validator::HasLen;

#[derive(Deserialize, Validate, Clone)]
#[serde(try_from = "String")]
pub struct Password {
    #[validate(length(min = 4, max = 128))]
    password: String
}

#[derive(Deserialize, Validate, Clone, Debug, shrinkwraprs::Shrinkwrap)]
#[serde(try_from = "String")]
pub struct Username {
    #[validate(length(min = 1, max = 128), non_control_character)]
    username: String,
}

#[derive(Deserialize, Clone, Debug, shrinkwraprs::Shrinkwrap)]
#[serde(try_from = "String")]
pub struct Email {
    email: CiText,
}

impl Validate for Email {
    fn validate(&self) -> Result<(), ValidationErrors> {
        use validator::*;

        #[derive(Validate)]
        struct Anon<'r> {
            #[validate(length(min = 1, max = 128), non_control_character, email)]
            email: &'r str
        };

        Anon {
            email: self.as_ref()
        }.validate()
    }
}

impl Password {
    pub fn new(s: String) -> Result<Self, ValidationErrors> {
        let out = Self { password: s };
        out.validate()?;
        Ok(out)
    }
    pub fn expose(&self) -> &str {
        &self.password
    }
    pub fn expose_into(self) -> String {self.password}
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

impl TryFrom<String> for Username {
    type Error = ValidationErrors;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let out = Self {
            username: value
        };

        out.validate()?;
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
    #[serde(flatten)]
    pub username: Username,
    #[serde(flatten)]
    pub password: Password,
    #[serde(flatten)]
    pub email: Email,
    #[serde(rename = "captchaToken")]
    pub captcha_token: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct LoginRequest {
    #[serde(flatten)]
    pub username: Username,
    #[serde(flatten)]
    pub password: Password,
}