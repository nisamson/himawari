
use crate::model::users;
use crate::db;
use actix_web::{post, delete, web, Responder, HttpResponse};
use actix_identity::Identity;
use crate::model::users::{User, LoginError, CreateError};

#[post("/login")]
pub async fn login(req: web::Json<users::LoginRequest>, id: Identity) -> Result<HttpResponse, LoginError> {
    let orig = req.into_inner();
    let user = orig.log_in(db::pool().await)
        .await?;

    id.remember(user.username().to_string());
    Ok(HttpResponse::Ok().finish())
}

#[delete("/login")]
pub async fn logout(id: Identity) -> HttpResponse {
    id.forget();
    HttpResponse::Ok().finish()
}

#[post("/register")]
pub async fn register(req: web::Json<users::CreationRequest>) -> Result<HttpResponse, CreateError> {
    let orig = req.into_inner();
    orig.create_user(db::pool().await).await?;
    Ok(HttpResponse::Ok().finish())
}