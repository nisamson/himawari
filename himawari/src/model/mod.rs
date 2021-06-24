use crate::api;
use rocket::request::{FromRequest, Outcome, FromParam};
use rocket::Request;
use rocket::http::Status;

pub mod users;
pub mod contests;

pub type RawItemId = i64;

#[derive(sqlx::Type, Debug,  PartialOrd, Ord, Serialize, Deserialize, Copy, Clone, Eq, PartialEq, Hash, shrinkwraprs::Shrinkwrap)]
#[sqlx(transparent)]
pub struct ItemId(RawItemId);

serde_plain::forward_display_to_serde!(ItemId);

#[async_trait::async_trait]
impl<'r> FromParam<'r> for ItemId {
    type Error = api::Error;

    fn from_param(param: &'r str) -> Result<Self, Self::Error> {
        let raw = param.parse::<RawItemId>()
            .map_err(|_| Status::BadRequest)?;
        Ok(ItemId(raw))
    }
}