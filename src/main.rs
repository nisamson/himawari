

use actix_web::{App, HttpServer};
use rand::Rng;
use actix_identity::{IdentityService, CookieIdentityPolicy};
use actix_web::middleware::Logger;
use actix_files::{Files, NamedFile};
use std::path::PathBuf;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::cookie::SameSite;


#[macro_use] extern crate born;

#[macro_use]
extern crate tracing;

mod model;
mod frontend;

#[tokio::main]
async fn main() {
    better_panic::install();
    if let Err(e) = dotenv::dotenv() {
        eprintln!("Won't be loading environment from dotenv file: {}", e);
    };

    tracing_subscriber::fmt::init();

    let local = tokio::task::LocalSet::new();
    let sys = actix_web::rt::System::run_in_tokio("himawari", &local);

    let port = std::env::var("PORT").unwrap().parse::<u16>().unwrap();
    let addr = format!("127.0.0.1:{}", port);

    // All sessions are invalidated at startup
    let session_key = rand::thread_rng().gen::<[u8; 32]>();
    info!("Starting server on http://{}", &addr);

    tokio::task::spawn(async {
        debug!("Setting up CTRL-C handler.");
        tokio::signal::ctrl_c().await.unwrap();
        warn!("Shutting down.");
        std::process::exit(0);
    });
    HttpServer::new(move || {
        App::new()
            .wrap(IdentityService::new(
                CookieIdentityPolicy::new(&session_key)
                    .name("HIMAWARI-AUTH")
                    .domain(std::env::var("DOMAIN").unwrap())
                    .same_site(SameSite::Strict)
                    .secure(false)
            ))
            .wrap(Logger::default())
            .service(frontend::static_assets)
    })
        .bind(&addr)
        .unwrap()
        .run()
        .await
        .unwrap();
    sys.await.unwrap();
}