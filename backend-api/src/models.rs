use crate::schema::{labels, projects, task_labels, tasks, time_entries};
use chrono::{NaiveDate, NaiveDateTime};
use diesel::prelude::*;
use serde::{Deserialize, Deserializer, Serialize}; // Deserializer est nécessaire pour deserialize_with
use uuid::Uuid;

// --- Fonctions Helper pour la Désérialisation des Champs Optionnels/Nullables ---

// Pour Option<Option<String>>
fn deserialize_opt_opt_string<'de, D>(deserializer: D) -> Result<Option<Option<String>>, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<String>::deserialize(deserializer) {
        Ok(Some(s)) => Ok(Some(Some(s))),
        Ok(None) => Ok(Some(None)), // JSON null -> Some(None)
        Err(e) => Err(e),
    }
}

// Pour Option<Option<Uuid>>
fn deserialize_opt_opt_uuid<'de, D>(deserializer: D) -> Result<Option<Option<Uuid>>, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<Uuid>::deserialize(deserializer) {
        Ok(Some(u)) => Ok(Some(Some(u))),
        Ok(None) => Ok(Some(None)),
        Err(e) => Err(e),
    }
}

// Pour Option<Option<NaiveDate>>
fn deserialize_opt_opt_naivedate<'de, D>(
    deserializer: D,
) -> Result<Option<Option<NaiveDate>>, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<NaiveDate>::deserialize(deserializer) {
        Ok(Some(d)) => Ok(Some(Some(d))),
        Ok(None) => Ok(Some(None)),
        Err(e) => Err(e),
    }
}

// Pour Option<Option<i32>>
fn deserialize_opt_opt_i32<'de, D>(deserializer: D) -> Result<Option<Option<i32>>, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<i32>::deserialize(deserializer) {
        Ok(Some(i)) => Ok(Some(Some(i))),
        Ok(None) => Ok(Some(None)),
        Err(e) => Err(e),
    }
}

// Pour Option<Option<NaiveDateTime>>
fn deserialize_opt_opt_naivedatetime<'de, D>(
    deserializer: D,
) -> Result<Option<Option<NaiveDateTime>>, D::Error>
where
    D: Deserializer<'de>,
{
    match Option::<NaiveDateTime>::deserialize(deserializer) {
        Ok(Some(dt)) => Ok(Some(Some(dt))),
        Ok(None) => Ok(Some(None)),
        Err(e) => Err(e),
    }
}

// --- Project Model ---
#[derive(Queryable, Selectable, Identifiable, Serialize, Deserialize, Debug, Clone, PartialEq)]
#[diesel(table_name = projects)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Project {
    /* ... comme avant ... */
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = projects)]
pub struct NewProject {
    /* ... comme avant ... */
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
}

#[derive(AsChangeset, Debug)]
#[diesel(table_name = projects)]
pub struct UpdateProjectChangeset {
    /* ... comme avant ... */
    pub name: Option<String>,
    pub color: Option<Option<String>>,
    pub updated_at: Option<NaiveDateTime>,
}

// --- Task Model ---
#[derive(
    Queryable,
    Selectable,
    Identifiable,
    Associations,
    Serialize,
    Deserialize,
    Debug,
    Clone,
    PartialEq,
)]
#[diesel(table_name = tasks)]
#[diesel(belongs_to(Project, foreign_key = project_id))]
pub struct Task {
    /* ... comme avant ... */
    pub id: Uuid,
    pub user_id: Uuid,
    pub project_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub due_date: Option<NaiveDate>,
    #[diesel(column_name = task_order)]
    pub order: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = tasks)]
pub struct NewTask {
    /* ... comme avant ... */
    pub user_id: Uuid,
    pub project_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub due_date: Option<NaiveDate>,
    #[diesel(column_name = task_order)]
    pub order: Option<i32>,
}

#[derive(AsChangeset, Debug)]
#[diesel(table_name = tasks)]
pub struct UpdateTaskChangeset {
    /* ... comme avant, avec updated_at ... */
    pub project_id: Option<Option<Uuid>>,
    pub title: Option<String>,
    pub description: Option<Option<String>>,
    pub status: Option<String>,
    pub due_date: Option<Option<NaiveDate>>,
    #[diesel(column_name = task_order)]
    pub order: Option<Option<i32>>,
    pub updated_at: Option<NaiveDateTime>,
}

// --- Label Model ---
#[derive(Queryable, Selectable, Identifiable, Serialize, Deserialize, Debug, Clone, PartialEq)]
#[diesel(table_name = labels)]
pub struct Label {
    /* ... comme avant ... */
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = labels)]
pub struct NewLabel {
    /* created_at/updated_at omis car gérés par DB */
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
}

#[derive(AsChangeset, Debug)]
#[diesel(table_name = labels)]
pub struct UpdateLabelChangeset {
    /* ... comme avant, avec updated_at ... */
    pub name: Option<String>,
    pub color: Option<Option<String>>,
    pub updated_at: Option<NaiveDateTime>,
}

// --- TaskLabel Model ---
#[derive(
    Queryable,
    Selectable,
    Associations,
    Identifiable,
    Serialize,
    Deserialize,
    Debug,
    Clone,
    PartialEq,
)]
#[diesel(table_name = task_labels)]
#[diesel(belongs_to(Task))]
#[diesel(belongs_to(Label))]
#[diesel(primary_key(task_id, label_id))]
pub struct TaskLabel {
    /* ... comme avant ... */
    pub task_id: Uuid,
    pub label_id: Uuid,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = task_labels)]
pub struct NewTaskLabelAssociation {
    /* ... comme avant ... */
    pub task_id: Uuid,
    pub label_id: Uuid,
}

// --- TimeEntry Model ---
#[derive(
    Queryable,
    Selectable,
    Identifiable,
    Associations,
    Serialize,
    Deserialize,
    Debug,
    Clone,
    PartialEq,
)]
#[diesel(table_name = time_entries)]
#[diesel(belongs_to(Task))]
pub struct TimeEntry {
    /* ... comme avant ... */
    pub id: Uuid,
    pub user_id: Uuid,
    pub task_id: Uuid,
    pub start_time: NaiveDateTime,
    pub end_time: Option<NaiveDateTime>,
    pub duration_seconds: Option<i32>,
    pub is_pomodoro_session: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = time_entries)]
pub struct NewTimeEntry {
    /* created_at/updated_at omis car gérés par DB */
    pub user_id: Uuid,
    pub task_id: Uuid,
    pub start_time: NaiveDateTime,
    pub end_time: Option<NaiveDateTime>,
    pub duration_seconds: Option<i32>,
    pub is_pomodoro_session: Option<bool>,
}

#[derive(AsChangeset, Debug)]
#[diesel(table_name = time_entries)]
pub struct UpdateTimeEntryChangeset {
    /* ... comme avant, avec updated_at ... */
    pub start_time: Option<NaiveDateTime>,
    pub end_time: Option<Option<NaiveDateTime>>,
    pub duration_seconds: Option<Option<i32>>,
    pub is_pomodoro_session: Option<bool>,
    pub updated_at: Option<NaiveDateTime>,
}

// --- PAYLOAD DTOs ---

#[derive(Deserialize, Debug)]
pub struct CreateProjectPayload {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateProjectPayload {
    pub name: Option<String>,
    #[serde(deserialize_with = "deserialize_opt_opt_string", default)]
    pub color: Option<Option<String>>,
}

#[derive(Deserialize, Debug)]
pub struct CreateTaskPayload {
    pub project_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub due_date: Option<NaiveDate>,
    pub order: Option<i32>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateTaskPayload {
    #[serde(deserialize_with = "deserialize_opt_opt_uuid", default)]
    pub project_id: Option<Option<Uuid>>,
    pub title: Option<String>,
    #[serde(deserialize_with = "deserialize_opt_opt_string", default)]
    pub description: Option<Option<String>>,
    pub status: Option<String>,
    #[serde(deserialize_with = "deserialize_opt_opt_naivedate", default)]
    pub due_date: Option<Option<NaiveDate>>,
    #[serde(deserialize_with = "deserialize_opt_opt_i32", default)]
    pub order: Option<Option<i32>>,
}

#[derive(Deserialize, Debug)]
pub struct CreateLabelPayload {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateLabelPayload {
    pub name: Option<String>,
    #[serde(deserialize_with = "deserialize_opt_opt_string", default)]
    pub color: Option<Option<String>>,
}

#[derive(Deserialize, Debug)]
pub struct CreateTimeEntryPayload {
    pub task_id: Uuid,
    pub start_time: NaiveDateTime,
    pub end_time: Option<NaiveDateTime>,
    pub duration_seconds: Option<i32>,
    pub is_pomodoro_session: Option<bool>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateTimeEntryPayload {
    pub start_time: Option<NaiveDateTime>, // Pourrait être Option<Option<NaiveDateTime>> si on veut le mettre à NULL
    #[serde(deserialize_with = "deserialize_opt_opt_naivedatetime", default)]
    pub end_time: Option<Option<NaiveDateTime>>,
    #[serde(deserialize_with = "deserialize_opt_opt_i32", default)]
    pub duration_seconds: Option<Option<i32>>,
    pub is_pomodoro_session: Option<bool>, // Boolean ne peut pas vraiment être "absent vs null", juste true/false/absent
}

// --- Pagination DTOs ---
#[derive(Deserialize, Debug)]
pub struct PaginationParams {
    #[serde(default = "default_page")]
    pub page: i64,
    #[serde(default = "default_per_page")]
    pub per_page: i64,
}
fn default_page() -> i64 {
    1
}
fn default_per_page() -> i64 {
    10
}
#[derive(Serialize, Debug)]
pub struct PaginatedResponse<T> {
    /* ... comme avant ... */
    pub items: Vec<T>,
    pub total_items: i64,
    pub total_pages: i64,
    pub page: i64,
    pub per_page: i64,
}
