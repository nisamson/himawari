

use actix_web::{App, HttpServer, web};
use rand::Rng;
use actix_identity::{IdentityService, CookieIdentityPolicy};
use actix_web::middleware::Logger;
use std::path::PathBuf;
use actix_web::dev::{ServiceRequest, ServiceResponse};
use actix_web::cookie::SameSite;
use std::time::Duration;

#[macro_use] extern crate serde;

#[macro_use] extern crate born;

#[macro_use]
extern crate tracing;

mod model;
mod db;
mod api;


fn main() {
    actix_rt::System::with_tokio_rt(|| {
        tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .max_blocking_threads(128)
            .build()
            .unwrap()
    }).block_on(async_main())
}

async fn async_main() {
    better_panic::install();
    if let Err(e) = dotenv::dotenv() {
        eprintln!("Won't be loading environment from dotenv file: {}", e);
    };

    tracing_subscriber::fmt::init();


    let port = std::env::var("PORT").unwrap().parse::<u16>().unwrap();
    let addr = format!("127.0.0.1:{}", port);

    info!("Connecting to database");
    let _ = db::pool().await;

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
                    .same_site(SameSite::Lax)
                    .max_age_secs(chrono::Duration::days(7).num_seconds())
                    .http_only(true)
                    .secure(true)
            ))
            .wrap(Logger::default())
            .service(web::scope("/api")
                .service(api::login::login)
                .service(api::login::logout)
                .service(api::login::register))
            // .service(frontend::static_assets)
    })
        .bind(&addr)
        .unwrap()
        .run()
        .await
        .unwrap();
}