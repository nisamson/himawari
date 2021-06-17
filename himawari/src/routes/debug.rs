use crate::model::users;
use crate::api;
use rocket::serde::json;
use crate::logging::RequestId;

#[rocket::put("/echo-me")]
#[instrument(level = "debug")]
pub async fn echo_token(id: RequestId, user: users::Info) -> api::Result<json::Json<users::Info>> {
    Ok(json::Json(user))
}