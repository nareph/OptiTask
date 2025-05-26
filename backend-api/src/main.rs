// OptiTask/backend-api/src/main.rs
mod db;
mod models;
pub mod schema; // Diesel génère cela, il faut le déclarer pub pour les autres modules

use actix_web::{get, web, App, HttpResponse, HttpServer, Responder};
use db::DbPool;

#[get("/health")]
async fn health_check(pool: web::Data<DbPool>) -> impl Responder {
    // Test simple pour obtenir une connexion du pool
    // Note : pool.get() est une opération bloquante.
    // Dans un vrai handler, pour une opération DB, on utiliserait web::block
    match web::block(move || pool.get()).await {
        Ok(Ok(_conn)) => HttpResponse::Ok().json("Healthy and DB Pool connected"),
        Ok(Err(e)) => {
            eprintln!("Failed to get DB connection from pool: {:?}", e);
            HttpResponse::InternalServerError().json("DB Pool connection error")
        }
        Err(e) => {
            // Erreur de web::block (BlockingError)
            eprintln!("Failed to run blocking task: {:?}", e);
            HttpResponse::InternalServerError().json("Internal server error (blocking task)")
        }
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok(); // Chargement de .env pour SERVER_ADDRESS etc.
                            // establish_connection_pool charge déjà dotenv pour DATABASE_URL

    let pool = db::establish_connection_pool();

    let server_address =
        std::env::var("SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1:8080".to_string());
    println!("🚀 Server starting on http://{}", server_address);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .service(health_check)
        // ... vos autres services/routes
    })
    .bind(server_address)?
    .run()
    .await
}
