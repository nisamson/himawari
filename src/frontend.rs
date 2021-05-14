use actix_web::{HttpRequest, Responder, get, web};
use std::str::FromStr;
use actix_web::dev::HttpResponseBuilder;
use actix_web::http::StatusCode;
use include_dir::Dir;

static STATIC_DIR: Dir = include_dir::include_dir!("frontend/build/");

#[get("/{filename:.*}")]
pub async fn static_assets(web::Path(filename): web::Path<String>) -> impl Responder {
    let file = STATIC_DIR.get_file(&filename);

    let (contents, mime) = if let Some(contents) = file {
        (contents, mime_guess::from_path(&filename).first())
    } else {
        (STATIC_DIR.get_file("index.html").unwrap(),
         Some(mime_guess::Mime::from_str("text/html").unwrap()))
    };

    let mut resp = HttpResponseBuilder::new(StatusCode::OK);
    if let Some(mime) = mime {
        resp.content_type(mime.essence_str());
    }

    let body = web::Bytes::from_static(contents.contents());

    resp.body(body).await
}