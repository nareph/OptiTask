use crate::auth_utils::AuthenticatedUser;
use crate::db::DbPool;
use crate::error_handler::ServiceError;
use crate::models::{
    CreateTaskPayload,
    NewTask,
    Task,
    UpdateTaskChangeset,
    UpdateTaskPayload,
    // PaginationParams, PaginatedResponse // Pour la pagination future
};
use crate::schema::tasks::{self, dsl::*};
use actix_web::{delete, get, post, put, web, HttpResponse, Result as ActixResult};
use chrono::Utc;
use diesel::prelude::*;
use diesel::RunQueryDsl; // Pour .execute() etc.
use serde_json::json; // Pour les réponses JSON personnalisées
use uuid::Uuid;

#[derive(serde::Deserialize, Debug)]
pub struct ListTasksQuery {
    pub project_id: Option<Uuid>,
    pub status: Option<String>,
    // pub page: Option<i64>,
    // pub per_page: Option<i64>,
}

// === POST /tasks ===
#[post("")] // Relatif au scope "/tasks" dans main.rs
pub async fn create_task_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    payload: web::Json<CreateTaskPayload>,
) -> ActixResult<HttpResponse, ServiceError> {
    log::info!("Create task payload received: {:?}", payload);

    let new_task_data = NewTask {
        user_id: authenticated_user.id,
        project_id: payload.project_id,
        title: payload.title.clone(),
        description: payload.description.clone(),
        status: payload.status.clone(),
        due_date: payload.due_date,
        order: payload.order,
    };

    let created_task = web::block(move || {
        let mut conn = pool.get()?;
        diesel::insert_into(tasks::table)
            .values(&new_task_data)
            .get_result::<Task>(&mut conn)
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (create_task): {:?}", e);
        ServiceError::InternalServerError("Error processing create_task request".to_string())
    })??;

    log::info!("Task created successfully: {:?}", created_task);
    Ok(HttpResponse::Created().json(created_task))
}

// === GET /tasks ===
#[get("")] // Relatif au scope "/tasks" dans main.rs
pub async fn list_tasks_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    query_params: web::Query<ListTasksQuery>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let query_options = query_params.into_inner();

    log::info!(
        "Listing tasks for user: {} with query options: {:?}",
        user_uuid,
        query_options
    );

    let task_list = web::block(move || {
        let mut conn = pool.get()?;
        let mut query = tasks
            .filter(user_id.eq(user_uuid))
            .order(task_order.asc().nulls_last())
            .then_order_by(created_at.desc())
            .select(Task::as_select())
            .into_boxed();

        if let Some(p_id) = query_options.project_id {
            query = query.filter(project_id.eq(p_id));
        }
        if let Some(s) = query_options.status {
            query = query.filter(status.eq(s));
        }

        query.load::<Task>(&mut conn).map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (list_tasks): {:?}", e);
        ServiceError::InternalServerError("Error processing list_tasks request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(task_list))
}

// === GET /tasks/{task_id_path} ===
#[get("/{task_id_path}")]
pub async fn get_task_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    task_id_path: web::Path<Uuid>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let task_to_find_id = task_id_path.into_inner();

    log::info!("Fetching task {} for user {}", task_to_find_id, user_uuid);

    let task_option = web::block(move || {
        let mut conn = pool.get()?;
        tasks
            .filter(user_id.eq(user_uuid))
            .filter(id.eq(task_to_find_id))
            .select(Task::as_select())
            .first::<Task>(&mut conn)
            .optional() // Retourne Ok(None) si non trouvé
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (get_task): {:?}", e);
        ServiceError::InternalServerError("Error processing get_task request".to_string())
    })??;

    match task_option {
        Some(task) => Ok(HttpResponse::Ok().json(task)),
        None => Err(ServiceError::NotFound(format!(
            "Task with id {} not found or not owned by user",
            task_to_find_id
        ))),
    }
}

// === PUT /tasks/{task_id_path} ===
#[put("/{task_id_path}")]
pub async fn update_task_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    task_id_path: web::Path<Uuid>,
    payload: web::Json<UpdateTaskPayload>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let task_to_update_id = task_id_path.into_inner();

    log::info!(
        "Update task payload for task {}: {:?}",
        task_to_update_id,
        payload
    );

    // Construire le changeset à partir du payload.
    // payload.project_id est Option<Option<Uuid>> grâce à deserialize_with.
    // payload.description est Option<Option<String>> grâce à deserialize_with.
    // etc.
    let task_changes = UpdateTaskChangeset {
        project_id: payload.project_id.clone(),
        title: payload.title.clone(),
        description: payload.description.clone(),
        status: payload.status.clone(),
        due_date: payload.due_date.clone(),
        order: payload.order.clone(),
        updated_at: Some(Utc::now().naive_utc()), // Toujours mettre à jour
    };

    log::info!(
        "Changeset to apply for task {}: {:?}",
        task_to_update_id,
        task_changes
    );

    let updated_task = web::block(move || {
        let mut conn = pool.get()?;
        diesel::update(
            tasks
                .filter(id.eq(task_to_update_id))
                .filter(user_id.eq(user_uuid)), // S'assurer de la propriété
        )
        .set(&task_changes)
        .get_result::<Task>(&mut conn)
        .map_err(ServiceError::from) // Gère DieselError::NotFound en ServiceError::NotFound
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (update_task): {:?}", e);
        ServiceError::InternalServerError("Error processing update_task request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(updated_task))
}

// === DELETE /tasks/{task_id_path} ===
#[delete("/{task_id_path}")]
pub async fn delete_task_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    task_id_path: web::Path<Uuid>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let task_to_delete_id = task_id_path.into_inner();

    log::info!("Deleting task {} for user {}", task_to_delete_id, user_uuid);

    let num_deleted = web::block(move || {
        let mut conn = pool.get()?;
        diesel::delete(
            tasks
                .filter(user_id.eq(user_uuid))
                .filter(id.eq(task_to_delete_id)),
        )
        .execute(&mut conn) // execute() retourne le nombre de lignes affectées
        .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (delete_task): {:?}", e);
        ServiceError::InternalServerError("Error processing delete_task request".to_string())
    })??;

    if num_deleted > 0 {
        Ok(HttpResponse::Ok().json(json!({
            "status": "success",
            "message": format!("Task with id {} deleted successfully", task_to_delete_id)
        })))
    } else {
        // Cela peut se produire si la tâche n'existe pas ou n'appartient pas à l'utilisateur
        Err(ServiceError::NotFound(format!(
            "Task with id {} not found or not owned by user to delete",
            task_to_delete_id
        )))
    }
}
