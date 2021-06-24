use crate::logging::RequestId;
use crate::model::{users, ItemId, RawItemId};
use crate::{api, db, secure};
use rocket::serde::json;
use crate::model::contests::Contest;
use validator::Validate;
use rocket::response::status;
use rocket::http::Status;


#[rocket::get("/contest")]
#[instrument(level = "info")]
pub async fn my_contests(id: RequestId, info: users::Info) -> api::Result<json::Json<Vec<Contest>>> {
    let contests = info.contests().await?;
    Ok(json::Json(contests))
}

#[derive(Deserialize, validator::Validate)]
pub struct NewContest {
    #[validate(length(min = 1, max = 1024), non_control_character)]
    name: String,
}

#[rocket::post("/contest", format = "json", data = "<contest>")]
#[instrument(level = "info", skip(contest))]
pub async fn new_contest(id: RequestId, info: users::Info, contest: json::Json<NewContest>) -> api::Result<status::Custom<json::Json<Contest>>> {
    contest.0.validate()?;
    let res = sqlx::query_as!(
        Contest,
        r#"
        INSERT INTO contests (owner, name) VALUES ($1, $2) RETURNING id as "id: _", owner as "owner: _", name, created;
        "#,
        info.username.as_str(),
        contest.0.name
    ).fetch_one(db::pool())
        .await?;

    Ok(status::Custom(Status::Created, json::Json(res)))
}

#[rocket::get("/contest/<contest_id>")]
#[instrument(level = "info")]
pub async fn get_contest(id: RequestId, contest_id: ItemId, info: users::Info) -> api::Result<json::Json<Contest>> {
    let access = info.access_level::<Contest>(&contest_id).await?;
    access.ensure_at_least(secure::Role::Collaborator)?;
    Ok(json::Json(Contest::load(contest_id).await?))
}

#[rocket::delete("/contest/<contest_id>")]
#[instrument(level = "info")]
pub async fn delete_contest(id: RequestId, contest_id: ItemId, info: users::Info) -> api::Result<Status> {
    let access = info.access_level::<Contest>(&contest_id).await?;
    access.ensure_at_least(secure::Role::Owner)?;
    Contest::delete(contest_id).await?;

    Ok(Status::Ok)
}