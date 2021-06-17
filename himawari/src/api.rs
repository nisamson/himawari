use rocket::serde::json;
use rocket::response::{Responder, status};
use rocket::{Request, response, Response};
use rocket::http::hyper::StatusCode;
use std::borrow::Cow;
use rocket::http::{Status, ContentType};
use std::fmt::{Debug, Formatter};
use std::fmt;
use validator::ValidationErrors;
use std::io::Cursor;

pub trait ResponseError: Debug {
    fn status(&self) -> Status;
    fn message(&self) -> Cow<'static, str>;
    fn client_message(&self) -> Cow<'static, str> {
        if self.status().class().is_server_error() {
            Cow::Borrowed("Internal server error")
        } else {
            self.message()
        }
    }
}

pub struct Error {
    err: Box<dyn ResponseError + Send + Sync>,
}

impl fmt::Debug for Error {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        if self.err.status().class().is_server_error() {
            error!("{}", self.err.message());
        }
        write!(f, "{}", self.err.client_message())
    }
}

impl ResponseError for String {
    fn status(&self) -> Status {
        Status::InternalServerError
    }

    fn message(&self) -> Cow<'static, str> {
        self.to_string().into()
    }
}

impl ResponseError for &'static str {
    fn status(&self) -> Status {
        Status::InternalServerError
    }

    fn message(&self) -> Cow<'static, str> {
        Cow::Borrowed(self)
    }
}

impl<R: ResponseError + Send + Sync + 'static> From<R> for Error {
    fn from(err: R) -> Self {
        let class = err.status().class();
        assert!(class.is_server_error() || class.is_client_error());
        Self {
            err: Box::new(err)
        }
    }
}

impl ResponseError for ValidationErrors {
    fn status(&self) -> Status {
        Status::BadRequest
    }

    fn message(&self) -> Cow<'static, str> {
        self.to_string().into()
    }
}

impl Error {
    pub fn from_error(err: impl std::fmt::Debug) -> Self {
        format!("{:?}", err).into()
    }
    pub fn as_inner(&self) -> &dyn ResponseError {
        self.err.as_ref()
    }
}

impl<'r, 'o: 'r> Responder<'r, 'o> for Error {
    fn respond_to(self, request: &'r Request<'_>) -> response::Result<'o> {
        debug!("Entered error responder");
        let message = serde_json::json!({
                "status": self.err.status().code,
                "message": self.err.client_message()
            });

        if self.err.status().class().is_server_error() {
            error!("{}", self.err.message());
        };

        let body = serde_json::to_string(&message).map_err(Error::from_error).map_err(|e| e.respond_to(request));
        let body = match body {
            Ok(b) => {b}
            Err(r) => {return r;}
        };

        let len = body.len();
        let body_cur = Cursor::new(body);
        let response = response::Response::build()
            .status(self.err.status())
            .header(ContentType::JSON)
            .sized_body(len, body_cur)
            .ok();
        response
    }
}

impl ResponseError for Status {
    fn status(&self) -> Status {
        *self
    }

    fn message(&self) -> Cow<'static, str> {
        self.reason_lossy().into()
    }
}

pub fn need_env_var(name: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| panic!("{} needs to be set", name))
}

pub type Result<T> = std::result::Result<T, Error>;