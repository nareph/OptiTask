// OptiTask/backend-api/src/main.rs
mod auth_utils;
mod db;
mod error_handler;
mod handlers;
mod models;
pub mod schema;

// Ajouts pour JsonConfig
use actix_web::{
    error::JsonPayloadError, // Pour le type d'erreur dans le handler
    get,
    web,
    App,
    HttpResponse,
    HttpServer,
};

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
        // DÉBUT DE L'AJOUT/MODIFICATION POUR JSONCONFIG
        let json_config = web::JsonConfig::default()
            .limit(4096) // Exemple de limite de taille
            .error_handler(|err: JsonPayloadError, _req| {
                // Log détaillé côté serveur
                log::error!("JSON Payload Deserialization Error: {:?}", err);

                let error_description = match &err {
                    JsonPayloadError::Deserialize(serde_err) => {
                        format!("Invalid JSON format: {}", serde_err)
                    }
                    JsonPayloadError::OverflowKnownLength { length, limit } => {
                        format!("JSON payload (size: {}) exceeds limit ({})", length, limit)
                    }
                    JsonPayloadError::Overflow { limit } => {
                        format!("JSON payload exceeds limit ({})", limit)
                    }
                    JsonPayloadError::ContentType => {
                        "Invalid Content-Type header. Expected 'application/json'.".to_string()
                    }
                    JsonPayloadError::Payload(payload_err) => {
                        format!("Error reading payload: {}", payload_err)
                    }
                    _ => "Unknown JSON payload error.".to_string(),
                };

                // Utiliser votre ServiceError pour formater la réponse
                let service_error = error_handler::ServiceError::BadRequest(error_description);
                service_error.into() // Cela retourne une HttpResponse JSON
            });
        // FIN DE L'AJOUT/MODIFICATION POUR JSONCONFIG

        App::new()
            .wrap(actix_web::middleware::Logger::default())
            .app_data(web::Data::new(pool.clone()))
            .app_data(json_config) // <--- ENREGISTRER LA CONFIGURATION JSON PERSONNALISÉE
            .service(health_check)
            .service(
                web::scope("/projects")
                    .service(handlers::project_handlers::create_project_handler)
                    .service(handlers::project_handlers::list_projects_handler)
                    .service(handlers::project_handlers::get_project_handler)
                    .service(handlers::project_handlers::update_project_handler)
                    .service(handlers::project_handlers::delete_project_handler),
            )
            .service(
                web::scope("/tasks")
                    .service(handlers::task_handlers::create_task_handler)
                    .service(handlers::task_handlers::list_tasks_handler)
                    .service(handlers::task_handlers::get_task_handler)
                    .service(handlers::task_handlers::update_task_handler)
                    .service(handlers::task_handlers::delete_task_handler)
                    // Services pour les labels d'une tâche (utilisent le même scope /tasks)
                    .service(handlers::task_label_handlers::add_label_to_task_handler) // POST /tasks/{taskId}/labels
                    .service(handlers::task_label_handlers::list_labels_for_task_handler) // GET /tasks/{taskId}/labels
                    .service(handlers::task_label_handlers::remove_label_from_task_handler), // DELETE /tasks/{taskId}/labels/{labelId}
            )
            .service(
                web::scope("/labels")
                    .service(handlers::label_handlers::create_label_handler)
                    .service(handlers::label_handlers::list_labels_handler)
                    .service(handlers::label_handlers::get_label_handler)
                    .service(handlers::label_handlers::update_label_handler)
                    .service(handlers::label_handlers::delete_label_handler),
            )
            .service(
                web::scope("/time-entries")
                    .service(handlers::time_entry_handlers::create_time_entry_handler)
                    .service(handlers::time_entry_handlers::list_time_entries_handler)
                    .service(handlers::time_entry_handlers::get_time_entry_handler)
                    .service(handlers::time_entry_handlers::update_time_entry_handler)
                    .service(handlers::time_entry_handlers::delete_time_entry_handler),
            )
            .service(
                web::scope("/analytics") 
                    .service(handlers::analytics_handlers::get_time_by_project_handler)
                    .service(handlers::analytics_handlers::get_productivity_trend_handler),
            )
    })
    .bind(server_address)?
    .run()
    .await
}
