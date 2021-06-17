
#[macro_use] extern crate serde;
#[macro_use] extern crate tracing;

use rocket::{Config, Request, Data};
use rocket::figment::Figment;
use crate::db::run_migrations;
use crate::api::need_env_var;
use tracing_log::LogTracer;
use tracing_subscriber::{EnvFilter, Layer};
use rocket::fairing::{Fairing, Info};
use rocket::fairing::Kind;
use tracing::Instrument;
use crate::logging::RequestIdManager;

mod about;
mod db;
mod routes;
mod model;
mod api;
mod recaptcha;
mod http;
mod logging;

#[tokio::main]
async fn main() {
    better_panic::install();

    let matches = clap::App::new(about::NAME)
        .author(about::AUTHORS)
        .version(about::VERSION)
        .arg(clap::Arg::with_name("env-file")
            .default_value(".env")
            .value_name("ENV_FILE")
            .help("Location of the environment file to load configuration from.")
            .index(1))
        .get_matches();

    let env_file = matches.value_of("env-file").unwrap();
    let _ = dotenv::from_filename(env_file);

    let filter = EnvFilter::from_env("HIMAWARI_LOG");
    LogTracer::init().unwrap();

    let collector = tracing_subscriber::fmt()
        .with_env_filter(filter)
        .finish();

    tracing::subscriber::set_global_default(collector).unwrap();

    info!("running migrations");
    run_migrations().await.unwrap();

    let port = need_env_var("SERVER_PORT")
        .parse::<u16>()
        .expect("Invalid port number.");

    info!("starting server");
    let config = Figment::from(Config::default())
        .merge(("port", port));

    let r = rocket::custom(config)
        .manage(RequestIdManager::new())
        .mount("/api",
               rocket::routes![
                   routes::auth::register,
                   routes::auth::login,
                   routes::contests::my_contests,
                   routes::contests::new_contest
               ]);
    #[cfg(debug_assertions)]
    let r = r.mount("/debug", rocket::routes![routes::debug::echo_token]);
    r
        .launch()
        .await
        .unwrap();
}