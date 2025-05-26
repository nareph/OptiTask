// backend-api/src/main.rs
use actix_web::{get, web, App, HttpServer, Responder, HttpResponse};
use dotenvy::dotenv;
use std::env;

#[get("/health")]
async fn health_check() -> impl Responder {
    HttpResponse::Ok().json("Healthy")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok(); // Charge .env (nous en créerons un pour le backend)

    let server_address = env::var("SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1:8080".to_string());
    println!("🚀 Server starting on http://{}", server_address);

    HttpServer::new(|| {
        App::new()
            .service(health_check)
    })
    .bind(server_address)?
    .run()
    .await
}