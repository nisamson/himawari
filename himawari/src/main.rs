use actix_web::{get, web, App, HttpServer, Responder};
use rand::Rng;
use actix_identity::{IdentityService, CookieIdentityPolicy};
use rustls::{NoClientAuth, ServerConfig};
use std::io::Cursor;
use rustls::internal::pemfile::{certs, rsa_private_keys};
use actix_web::middleware::Logger;

#[macro_use] extern crate tracing;

#[get("/{id}/{name}/index.html")]
async fn index(web::Path((id, name)): web::Path<(u32, String)>) -> impl Responder {
    format!("Hello {}! id:{}", name, id)
}

#[tokio::main]
async fn main() {
    better_panic::install();
    if let Err(e) = dotenv::dotenv() {
        eprintln!("Won't be loading environment from dotenv file: {}", e);
    };

    tracing_subscriber::fmt::init();

    let mut ssl_conf = ServerConfig::new(NoClientAuth::new());


    let local = tokio::task::LocalSet::new();
    let sys = actix_web::rt::System::run_in_tokio("himawari", &local);
    let certf = tokio::fs::read(std::env::var("SSL_CERT").unwrap()).await.unwrap();
    let keyf = tokio::fs::read(std::env::var("SSL_KEY").unwrap()).await.unwrap();

    let mut curs = Cursor::new(&certf);
    let certs = certs(&mut curs).unwrap();
    let mut curs = Cursor::new(&keyf);
    let keys = rsa_private_keys(&mut curs).unwrap();
    ssl_conf.set_single_cert(certs, keys.into_iter().next().unwrap()).unwrap();

    let port = std::env::var("PORT").unwrap().parse::<u16>().unwrap();
    let addr = format!("127.0.0.1:{}", port);

    // All sessions are invalidated at startup
    let session_key = rand::thread_rng().gen::<[u8; 32]>();
    info!("Starting server on https://{}", &addr);

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
                    .name("himawari-auth")
                    .domain(std::env::var("DOMAIN").unwrap())
                    .secure(true)
            ))
            .wrap(Logger::default())
            .service(index)
    })
        .bind_rustls(&addr, ssl_conf)
        .unwrap()
        .run()
        .await
        .unwrap();
    sys.await.unwrap();
}