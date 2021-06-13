use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::fmt;
use std::fmt::Formatter;
use rocket::request::FromRequest;
use rocket::{Request, request, State};
use rocket::http::Status;
use rocket::outcome::Outcome;

pub struct RequestIdManager(AtomicU64);

impl RequestIdManager {
    pub fn new() -> Self {
        Self(AtomicU64::new(0))
    }

    pub fn next(&self) -> RequestId {
        RequestId(self.0.fetch_add(1, Ordering::Relaxed))
    }
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(transparent)]
pub struct RequestId(u64);

impl fmt::Display for RequestId {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for RequestId {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let rman = request.rocket().state::<RequestIdManager>().unwrap();

        let rid = request.local_cache(|| {
            rman.next()
        });

        request::Outcome::Success(*rid)
    }
}