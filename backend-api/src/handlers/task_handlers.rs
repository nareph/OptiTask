// OptiTask/backend-api/src/handlers/task_handlers.rs

use crate::auth_utils::AuthenticatedUser;
use crate::db::DbPool;
use crate::error_handler::ServiceError;
use crate::models::{
    CreateTaskPayload, Label, NewTask, Task, TaskApiResponse, TaskLabel, UpdateTaskChangeset,
    UpdateTaskPayload,
};
use crate::schema::{
    labels, task_labels,
    tasks::{self, dsl::*},
};
use actix_web::{delete, get, post, put, web, HttpResponse, Result as ActixResult};
use chrono::Utc;
use diesel::prelude::*;
use diesel::RunQueryDsl;
use serde_json::json;
use std::collections::HashMap;
use uuid::Uuid;

#[derive(serde::Deserialize, Debug)]
pub struct ListTasksQuery {
    pub project_id: Option<Uuid>,
    pub status: Option<String>,
}

// === POST /tasks ===
#[post("")]
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
        status: payload.status.clone().or_else(|| Some("todo".to_string())),
        due_date: payload.due_date,
        order: payload.order,
    };

    let created_task_db: Task = web::block(move || -> Result<Task, ServiceError> {
        let mut conn = pool.get()?; // Propage ServiceError
        diesel::insert_into(tasks::table)
            .values(&new_task_data)
            .get_result::<Task>(&mut conn)
            .map_err(ServiceError::from) // Convertit DieselError en ServiceError
                                         // Ou simplement .get_result::<Task>(&mut conn)? si From<DieselError> est bien géré
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (create_task): {:?}", e);
        ServiceError::InternalServerError("Error processing create_task request".to_string())
    })??;

    let api_response = TaskApiResponse::from(created_task_db);

    log::info!("Task created successfully: {:?}", api_response);
    Ok(HttpResponse::Created().json(api_response))
}

// === GET /tasks ===
#[get("")]
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

    let tasks_with_labels_response: Vec<TaskApiResponse> =
        web::block(move || -> Result<Vec<TaskApiResponse>, ServiceError> {
            let mut conn = pool.get()?;

            let mut query_builder = tasks
                .filter(user_id.eq(user_uuid))
                .order(task_order.asc().nulls_last())
                .then_order_by(created_at.desc())
                .select(Task::as_select())
                .into_boxed();

            if let Some(p_id) = query_options.project_id {
                query_builder = query_builder.filter(project_id.eq(p_id));
            }
            if let Some(s) = query_options.status {
                query_builder = query_builder.filter(status.eq(s));
            }
            let fetched_tasks: Vec<Task> = query_builder.load::<Task>(&mut conn)?;

            if fetched_tasks.is_empty() {
                return Ok(Vec::new());
            }

            let task_ids: Vec<Uuid> = fetched_tasks.iter().map(|t| t.id).collect();

            let task_label_associations_with_labels: Vec<(TaskLabel, Label)> = task_labels::table
                .filter(task_labels::task_id.eq_any(&task_ids))
                .inner_join(labels::table.on(labels::id.eq(task_labels::label_id)))
                .select((TaskLabel::as_select(), Label::as_select()))
                .load::<(TaskLabel, Label)>(&mut conn)?;

            let mut labels_by_task_id: HashMap<Uuid, Vec<Label>> = HashMap::new();
            for (task_label_assoc, label_data) in task_label_associations_with_labels {
                labels_by_task_id
                    .entry(task_label_assoc.task_id)
                    .or_default()
                    .push(label_data);
            }

            let result_api_responses: Vec<TaskApiResponse> = fetched_tasks
                .into_iter()
                .map(|task_db| {
                    let mut api_response = TaskApiResponse::from(task_db.clone());
                    if let Some(associated_labels) = labels_by_task_id.get(&task_db.id) {
                        api_response.labels = associated_labels.clone();
                    }
                    api_response
                })
                .collect();

            Ok(result_api_responses)
        })
        .await
        .map_err(|e| {
            log::error!("Blocking task error (list_tasks): {:?}", e);
            ServiceError::InternalServerError("Error processing list_tasks request".to_string())
        })??;

    Ok(HttpResponse::Ok().json(tasks_with_labels_response))
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

    let task_api_response_option: Option<TaskApiResponse> =
        web::block(move || -> Result<Option<TaskApiResponse>, ServiceError> {
            let mut conn = pool.get()?;

            let task_db_option: Option<Task> = tasks
                .filter(user_id.eq(user_uuid))
                .filter(id.eq(task_to_find_id))
                .select(Task::as_select())
                .first::<Task>(&mut conn)
                .optional()?; // Gère Err(NotFound) en Ok(None), propage les autres erreurs

            match task_db_option {
                Some(task_db) => {
                    let associated_labels: Vec<Label> = task_labels::table
                        .filter(task_labels::task_id.eq(task_db.id))
                        .inner_join(labels::table.on(labels::id.eq(task_labels::label_id)))
                        .select(Label::as_select())
                        .load::<Label>(&mut conn)?;

                    let mut api_response = TaskApiResponse::from(task_db);
                    api_response.labels = associated_labels;
                    Ok(Some(api_response))
                }
                None => Ok(None),
            }
        })
        .await
        .map_err(|e| {
            log::error!("Blocking task error (get_task): {:?}", e);
            ServiceError::InternalServerError("Error processing get_task request".to_string())
        })??;

    match task_api_response_option {
        Some(response) => Ok(HttpResponse::Ok().json(response)),
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

    let task_changes = UpdateTaskChangeset {
        project_id: payload.project_id.clone(),
        title: payload.title.clone(),
        description: payload.description.clone(),
        status: payload.status.clone(),
        due_date: payload.due_date.clone(),
        order: payload.order.clone(),
        updated_at: Some(Utc::now().naive_utc()),
    };

    log::info!(
        "Changeset to apply for task {}: {:?}",
        task_to_update_id,
        task_changes
    );

    let updated_task_api_response: TaskApiResponse =
        web::block(move || -> Result<TaskApiResponse, ServiceError> {
            let mut conn = pool.get()?;

            let updated_task_db: Task = diesel::update(
                tasks
                    .filter(id.eq(task_to_update_id))
                    .filter(user_id.eq(user_uuid)),
            )
            .set(&task_changes)
            .get_result::<Task>(&mut conn)?; // Gère DieselError::NotFound via From

            let associated_labels: Vec<Label> = task_labels::table
                .filter(task_labels::task_id.eq(updated_task_db.id))
                .inner_join(labels::table.on(labels::id.eq(task_labels::label_id)))
                .select(Label::as_select())
                .load::<Label>(&mut conn)?;

            let mut api_response = TaskApiResponse::from(updated_task_db);
            api_response.labels = associated_labels;
            Ok(api_response)
        })
        .await
        .map_err(|e| {
            log::error!("Blocking task error (update_task): {:?}", e);
            ServiceError::InternalServerError("Error processing update_task request".to_string())
        })??;

    Ok(HttpResponse::Ok().json(updated_task_api_response))
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

    let num_deleted = web::block(move || -> Result<usize, ServiceError> {
        let mut conn = pool.get()?;
        diesel::delete(
            tasks
                .filter(user_id.eq(user_uuid))
                .filter(id.eq(task_to_delete_id)),
        )
        .execute(&mut conn)
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
        Err(ServiceError::NotFound(format!(
            "Task with id {} not found or not owned by user to delete",
            task_to_delete_id
        )))
    }
}
