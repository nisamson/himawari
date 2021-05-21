use actix_web::{Responder, web, post, HttpResponse, HttpRequest, FromRequest, Error};
use futures::StreamExt;

#[post("/report-csp-violation")]
pub async fn csp_report(mut body: web::Payload) -> Result<HttpResponse, Error> {
    let mut bytes = web::BytesMut::new();
    while let Some(chunk) = body.next().await {
        let chunk = chunk?;
        bytes.extend_from_slice(&chunk);
    }

    let as_json: serde_json::Value = serde_json::from_slice(&bytes)?;

    warn!("Got CSP violation: {}", serde_json::to_string_pretty(&as_json)
        .unwrap_or_else(|_| String::from_utf8_lossy(&bytes).to_string()));
    Ok(HttpResponse::Ok().finish())
}