// OptiTask/backend-api/src/main.rs
mod auth_utils;
mod db;
mod error_handler;
mod models;
mod project_handlers;
pub mod schema;
mod task_handlers; // Assurez-vous que ce module est déclaré

use actix_web::{get, web, App, HttpResponse, HttpServer};
use db::DbPool;

#[get("/health")]
async fn health_check(
    pool: web::Data<DbPool>,
) -> Result<HttpResponse, error_handler::ServiceError> {
    web::block(move || pool.get()).await.map_err(|e| {
        log::error!("Blocking task error (health_check pool.get): {:?}", e);
        error_handler::ServiceError::InternalServerError("Failed to check DB pool".to_string())
    })??;

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "status": "success",
        "message": "Healthy and DB Pool accessible"
    })))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let pool = db::establish_connection_pool();

    let server_address =
        std::env::var("SERVER_ADDRESS").unwrap_or_else(|_| "127.0.0.1:8080".to_string());
    log::info!("🚀 OptiTask Backend starting on http://{}", server_address);

    HttpServer::new(move || {
        App::new()
            .wrap(actix_web::middleware::Logger::default())
            .app_data(web::Data::new(pool.clone()))
            .service(health_check)
            .service(
                web::scope("/projects")
                    .service(project_handlers::create_project_handler)
                    .service(project_handlers::list_projects_handler)
                    .service(project_handlers::get_project_handler)
                    .service(project_handlers::update_project_handler)
                    .service(project_handlers::delete_project_handler),
            )
            .service(
                // Enregistrez tous les handlers de tâches
                web::scope("/tasks")
                    .service(task_handlers::create_task_handler)
                    .service(task_handlers::list_tasks_handler)
                    .service(task_handlers::get_task_handler)
                    .service(task_handlers::update_task_handler)
                    .service(task_handlers::delete_task_handler),
            )
    })
    .bind(server_address)?
    .run()
    .await
}
