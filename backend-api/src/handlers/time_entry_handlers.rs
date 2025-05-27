use crate::auth_utils::AuthenticatedUser;
use crate::db::DbPool;
use crate::error_handler::ServiceError;
use crate::models::{
    CreateTimeEntryPayload, NewTimeEntry, TimeEntry, UpdateTimeEntryChangeset,
    UpdateTimeEntryPayload,
};
use crate::schema::{
    tasks,                        // Importez tasks pour la vérification de propriété
    time_entries::{self, dsl::*}, // dsl::* pour les filtres etc.
};
use actix_web::{delete, get, post, put, web, HttpResponse, Result as ActixResult};
use chrono::{NaiveDateTime, Utc}; // Utc pour Utc::now()
use diesel::prelude::*;
use diesel::RunQueryDsl; // Pour .execute() etc.
use serde_json::json; // Pour les réponses JSON personnalisées
use uuid::Uuid;

// DTO pour les query parameters du listage
#[derive(serde::Deserialize, Debug)]
pub struct ListTimeEntriesQuery {
    pub task_id: Option<Uuid>,
    pub date_from: Option<NaiveDateTime>, // Format ISO8601: YYYY-MM-DDTHH:MM:SS
    pub date_to: Option<NaiveDateTime>,   // Format ISO8601: YYYY-MM-DDTHH:MM:SS
                                          // pub page: Option<i64>, // Pour la pagination future
                                          // pub per_page: Option<i64>,
}

// === POST /time-entries ===
#[post("")] // Relatif au scope "/time-entries" dans main.rs
pub async fn create_time_entry_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    payload: web::Json<CreateTimeEntryPayload>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id; // Uuid est Copy

    // Cloner les données du payload qui seront utilisées dans la closure web::block
    // Les types simples comme Uuid, NaiveDateTime, Option<T> (si T est simple) sont souvent Copy ou facilement clonables.
    let task_id_payload = payload.task_id;
    let start_time_payload = payload.start_time;
    let end_time_payload = payload.end_time;
    let duration_seconds_payload = payload.duration_seconds;
    let is_pomodoro_payload = payload.is_pomodoro_session;

    log::info!(
        "User {} creating time entry with payload: {:?}",
        user_uuid,
        payload.0 // Accéder aux données internes de web::Json pour le log
    );

    let created_entry = web::block(move || {
        let mut conn = pool.get().map_err(ServiceError::from)?;

        // 1. Vérifier que la tâche associée appartient à l'utilisateur
        tasks::table
            .filter(tasks::id.eq(task_id_payload))
            .filter(tasks::user_id.eq(user_uuid))
            .select(tasks::id)
            .first::<Uuid>(&mut conn)
            .map_err(|db_err| {
                // Gestion plus fine de l'erreur NotFound
                match db_err {
                    diesel::result::Error::NotFound => ServiceError::NotFound(format!(
                        "Task with id {} not found or not owned by user",
                        task_id_payload
                    )),
                    _ => ServiceError::from(db_err),
                }
            })?;

        // 2. Calculer duration_seconds si end_time est fourni et duration_seconds ne l'est pas
        let mut final_duration_seconds = duration_seconds_payload;
        if let Some(end) = end_time_payload {
            if final_duration_seconds.is_none() && end > start_time_payload {
                final_duration_seconds = Some((end - start_time_payload).num_seconds() as i32);
            }
        }

        let new_time_entry_data = NewTimeEntry {
            user_id: user_uuid,
            task_id: task_id_payload,
            start_time: start_time_payload,
            end_time: end_time_payload,
            duration_seconds: final_duration_seconds,
            is_pomodoro_session: is_pomodoro_payload, // NewTimeEntry.is_pomodoro_session est Option<bool>
                                                      // La DB a DEFAULT FALSE, donc None ici est ok.
        };

        // 3. Insérer
        diesel::insert_into(time_entries::table)
            .values(&new_time_entry_data)
            .get_result::<TimeEntry>(&mut conn)
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|e: actix_web::error::BlockingError| {
        // Expliciter le type d'erreur pour le débug
        log::error!("Blocking task error (create_time_entry): {:?}", e);
        ServiceError::InternalServerError("Error processing create_time_entry request".to_string())
    })??; // Double '??' pour déballer Result<Result<_, ServiceError>, BlockingError>

    log::info!("Time entry created successfully: {:?}", created_entry);
    Ok(HttpResponse::Created().json(created_entry))
}

// === GET /time-entries ===
#[get("")]
pub async fn list_time_entries_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    query_params: web::Query<ListTimeEntriesQuery>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let query_options = query_params.into_inner();
    log::info!(
        "User {} listing time entries with options: {:?}",
        user_uuid,
        query_options
    );

    let entries = web::block(move || {
        let mut conn = pool.get()?;
        let mut query = time_entries
            .filter(user_id.eq(user_uuid))
            .order(start_time.desc()) // Plus récent en premier
            .select(TimeEntry::as_select())
            .into_boxed();

        if let Some(t_id) = query_options.task_id {
            query = query.filter(task_id.eq(t_id));
        }
        if let Some(from_date) = query_options.date_from {
            query = query.filter(start_time.ge(from_date));
        }
        if let Some(to_date) = query_options.date_to {
            query = query.filter(start_time.le(to_date));
        }

        query
            .load::<TimeEntry>(&mut conn)
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (list_time_entries): {:?}", e);
        ServiceError::InternalServerError("Error processing list_time_entries request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(entries))
}

// === GET /time-entries/{entry_id_path} ===
#[get("/{entry_id_path}")]
pub async fn get_time_entry_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    entry_id_path: web::Path<Uuid>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let entry_to_find_id = entry_id_path.into_inner();
    log::info!(
        "User {} fetching time_entry {}",
        user_uuid,
        entry_to_find_id
    );

    let entry_option = web::block(move || {
        let mut conn = pool.get()?;
        time_entries
            .filter(user_id.eq(user_uuid))
            .filter(id.eq(entry_to_find_id))
            .select(TimeEntry::as_select())
            .first::<TimeEntry>(&mut conn)
            .optional()
            .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (get_time_entry): {:?}", e);
        ServiceError::InternalServerError("Error processing get_time_entry request".to_string())
    })??;

    match entry_option {
        Some(entry) => Ok(HttpResponse::Ok().json(entry)),
        None => Err(ServiceError::NotFound(format!(
            "TimeEntry with id {} not found or not owned by user",
            entry_to_find_id
        ))),
    }
}

// === PUT /time-entries/{entry_id_path} ===
#[put("/{entry_id_path}")]
pub async fn update_time_entry_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    entry_id_path: web::Path<Uuid>,
    payload: web::Json<UpdateTimeEntryPayload>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let entry_to_update_id = entry_id_path.into_inner();
    log::info!(
        "User {} updating time_entry {} with payload: {:?}",
        user_uuid,
        entry_to_update_id,
        payload.0 // Accéder aux données internes de web::Json pour le log
    );

    // Cloner pool pour le premier web::block
    let pool_clone_for_fetch = pool.clone();
    let entry_id_clone_for_fetch = entry_to_update_id; // Uuid est Copy
    let user_id_clone_for_fetch = user_uuid; // Uuid est Copy

    let current_entry_start_time = web::block(move || {
        let mut conn = pool_clone_for_fetch.get().map_err(ServiceError::from)?;
        time_entries
            .filter(id.eq(entry_id_clone_for_fetch))
            .filter(user_id.eq(user_id_clone_for_fetch))
            .select(start_time)
            .first::<NaiveDateTime>(&mut conn)
            .map_err(|db_err| match db_err {
                // Gestion plus fine de NotFound
                diesel::result::Error::NotFound => ServiceError::NotFound(format!(
                    "TimeEntry with id {} not found or not owned by user for update",
                    entry_id_clone_for_fetch
                )),
                _ => ServiceError::from(db_err),
            })
    })
    .await
    .map_err(|e: actix_web::error::BlockingError| {
        log::error!("Blocking error fetching start_time for update: {:?}", e);
        ServiceError::InternalServerError(
            "Error preparing update (fetching start_time)".to_string(),
        )
    })??;

    let mut changeset_duration = payload.duration_seconds.clone(); // payload.duration_seconds est Option<Option<i32>>
    if let Some(Some(end_t)) = payload.end_time {
        if changeset_duration.is_none() || changeset_duration == Some(None) {
            if end_t > current_entry_start_time {
                changeset_duration =
                    Some(Some((end_t - current_entry_start_time).num_seconds() as i32));
            }
        }
    }

    let entry_changes = UpdateTimeEntryChangeset {
        start_time: payload.start_time, // payload.start_time est Option<NaiveDateTime>
        end_time: payload.end_time.clone(),
        duration_seconds: changeset_duration,
        is_pomodoro_session: payload.is_pomodoro_session,
        updated_at: Some(Utc::now().naive_utc()),
    };

    log::info!(
        "Changeset for time_entry {}: {:?}",
        entry_to_update_id,
        entry_changes
    );

    let updated_entry = web::block(move || {
        // pool (l'original) est déplacé ici
        let mut conn = pool.get().map_err(ServiceError::from)?;
        diesel::update(
            time_entries
                .filter(id.eq(entry_to_update_id))
                .filter(user_id.eq(user_uuid)), // user_uuid est copié
        )
        .set(&entry_changes)
        .get_result::<TimeEntry>(&mut conn)
        .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (update_time_entry): {:?}", e);
        ServiceError::InternalServerError("Error processing update_time_entry request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(updated_entry))
}

// === DELETE /time-entries/{entry_id_path} ===
#[delete("/{entry_id_path}")]
pub async fn delete_time_entry_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    entry_id_path: web::Path<Uuid>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    let entry_to_delete_id = entry_id_path.into_inner();
    log::info!(
        "User {} deleting time_entry {}",
        user_uuid,
        entry_to_delete_id
    );

    let num_deleted = web::block(move || {
        let mut conn = pool.get()?;
        diesel::delete(
            time_entries
                .filter(user_id.eq(user_uuid))
                .filter(id.eq(entry_to_delete_id)),
        )
        .execute(&mut conn)
        .map_err(ServiceError::from)
    })
    .await
    .map_err(|e| {
        log::error!("Blocking task error (delete_time_entry): {:?}", e);
        ServiceError::InternalServerError("Error processing delete_time_entry request".to_string())
    })??;

    if num_deleted > 0 {
        Ok(HttpResponse::Ok().json(json!({
            "status": "success",
            "message": format!("TimeEntry with id {} deleted successfully", entry_to_delete_id)
        })))
    } else {
        Err(ServiceError::NotFound(format!(
            "TimeEntry with id {} not found or not owned by user to delete",
            entry_to_delete_id
        )))
    }
}
