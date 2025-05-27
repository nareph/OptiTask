// OptiTask/backend-api/src/project_handlers.rs
use crate::auth_utils::AuthenticatedUser;
use crate::db::DbPool;
use crate::error_handler::ServiceError;
use crate::models::{
    CreateProjectPayload, NewProject, Project, UpdateProjectChangeset, UpdateProjectPayload,
};
use crate::schema::projects::{self, dsl::*};
use actix_web::{delete, get, post, put, web, HttpResponse};
use chrono::Utc; // Importez Utc
use diesel::prelude::*;
use diesel::RunQueryDsl;
use serde_json::json;
use uuid::Uuid;

#[post("")]
pub async fn create_project_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    payload: web::Json<CreateProjectPayload>,
) -> Result<HttpResponse, ServiceError> {
    let new_project_data = NewProject {
        user_id: authenticated_user.id,
        name: payload.name.clone(),
        color: payload.color.clone(),
    };

    let project = web::block(move || {
        let mut conn = pool.get()?;
        diesel::insert_into(projects::table)
            .values(&new_project_data)
            .get_result::<Project>(&mut conn)
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|blocking_error| {
        log::error!("Blocking task error (create_project): {:?}", blocking_error);
        ServiceError::InternalServerError("Error processing request".to_string())
    })??;

    Ok(HttpResponse::Created().json(project))
}

#[get("")]
pub async fn list_projects_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
) -> Result<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;

    let project_list = web::block(move || {
        let mut conn = pool.get()?;
        projects
            .filter(user_id.eq(user_uuid))
            .select(Project::as_select())
            .load::<Project>(&mut conn)
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (list_projects): {:?}", e);
        ServiceError::InternalServerError("Error processing request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(project_list))
}

#[get("/{project_id_path}")]
pub async fn get_project_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    project_id_path: web::Path<Uuid>,
) -> Result<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let project_to_find_id = project_id_path.into_inner();

    let project_option = web::block(move || {
        let mut conn = pool.get()?;
        projects
            .filter(user_id.eq(user_uuid))
            .filter(id.eq(project_to_find_id))
            .select(Project::as_select())
            .first::<Project>(&mut conn)
            .optional()
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (get_project): {:?}", e);
        ServiceError::InternalServerError("Error processing request".to_string())
    })??;

    match project_option {
        Some(project) => Ok(HttpResponse::Ok().json(project)),
        None => Err(ServiceError::NotFound(format!(
            "Project with id {} not found or not owned by user",
            project_to_find_id
        ))),
    }
}

#[put("/{project_id_path}")]
pub async fn update_project_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    project_id_path: web::Path<Uuid>,
    payload: web::Json<UpdateProjectPayload>,
) -> Result<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let project_to_update_id = project_id_path.into_inner();

    let project_changes = UpdateProjectChangeset {
        name: payload.name.clone(),
        color: payload.color.clone(),
        updated_at: Some(Utc::now().naive_utc()),
    };

    let updated_project = web::block(move || {
        let mut conn = pool.get()?;
        diesel::update(
            projects
                .filter(id.eq(project_to_update_id))
                .filter(user_id.eq(user_uuid)),
        )
        .set(&project_changes)
        .get_result::<Project>(&mut conn)
        .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (update_project): {:?}", e);
        ServiceError::InternalServerError("Error processing request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(updated_project))
}

#[delete("/{project_id_path}")]
pub async fn delete_project_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    project_id_path: web::Path<Uuid>,
) -> Result<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let project_to_delete_id = project_id_path.into_inner();

    let num_deleted = web::block(move || {
        let mut conn = pool.get()?;
        diesel::delete(
            projects
                .filter(user_id.eq(user_uuid))
                .filter(id.eq(project_to_delete_id)),
        )
        .execute(&mut conn)
        .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (delete_project): {:?}", e);
        ServiceError::InternalServerError("Error processing request".to_string())
    })??;

    if num_deleted > 0 {
        Ok(HttpResponse::Ok().json(json!({
            "status": "success",
            "message": format!("Project with id {} deleted successfully", project_to_delete_id)
        })))
    } else {
        Err(ServiceError::NotFound(format!(
            "Project with id {} not found or not owned by user to delete",
            project_to_delete_id
        )))
    }
}
