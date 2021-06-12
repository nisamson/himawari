use once_cell::sync::Lazy;
use secrecy::{SecretString, ExposeSecret};
use crate::{api, http};
use std::collections::HashSet;
use serde::Serialize;
use crate::api::ResponseError;
use rocket::http::Status;
use std::borrow::Cow;

static RECAPTCHA_KEY: Lazy<SecretString> = Lazy::new(|| {
    SecretString::new(std::env::var("RECAPTCHA_SECRET_KEY")
        .expect("Missing recaptcha key: $RECAPTCHA_SECRET_KEY"))
});

#[derive(Serialize, Clone)]
struct Request {
    secret: String,
    response: String
}

#[derive(Copy, Clone, Debug, Serialize, Deserialize, Hash, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
enum ErrorCode {
    MissingInputSecret,
    InvalidInputSecret,
    MissingInputResponse,
    InvalidInputResponse,
    BadRequest,
    TimeoutOrDuplicate,
}

impl ResponseError for ErrorCode {
    fn status(&self) -> Status {
        match self {
            ErrorCode::MissingInputSecret |
            ErrorCode::InvalidInputSecret |
            ErrorCode::MissingInputResponse => { Status::InternalServerError }
            ErrorCode::InvalidInputResponse |
            ErrorCode::BadRequest |
            ErrorCode::TimeoutOrDuplicate => { Status::Unauthorized }
        }
    }

    fn message(&self) -> Cow<'static, str> {
        self.to_string().into()
    }
}

serde_plain::forward_display_to_serde!(ErrorCode);

impl Request {
    pub fn new(response: String) -> Self {
        Self {
            secret: RECAPTCHA_KEY.expose_secret().clone(),
            response
        }
    }
}

#[derive(Deserialize, Serialize, Debug)]
struct Response {
    success: bool,
    challenge_ts: String,
    hostname: String,
    #[serde(default)]
    error_codes: HashSet<ErrorCode>
}

const RECAPTCHA_URL: &str = "https://www.google.com/recaptcha/api/siteverify";

impl Response {
    pub fn ok(&self) -> Result<(), api::Error> {
        if self.success {
            Ok(())
        } else if let Some(code) = self.error_codes.iter().copied().next() {
            Err(code.into())
        } else {
            Err("Didn't get an error code".into())
        }
    }
}

#[instrument(level = "debug")]
pub async fn verify_captcha(token: String) -> api::Result<()> {
    debug!("verifying recaptcha");
    let request = Request::new(token);
    let client = http::client();
    let res = client.post(RECAPTCHA_URL)
        .form(&request)
        .send()
        .await
        .map_err(api::Error::from_error)?;


    let res: Response = res.json().await.map_err(api::Error::from_error)?;
    debug!("{}", serde_json::to_string_pretty(&res).unwrap());
    res.ok()
}