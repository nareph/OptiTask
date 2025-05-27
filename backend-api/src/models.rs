use crate::schema::{labels, projects, task_labels, tasks, time_entries};
use chrono::{NaiveDate, NaiveDateTime, Utc}; // Utc est nécessaire pour générer updated_at
use diesel::prelude::*;
use serde::Deserializer;
use serde::{Deserialize, Serialize};
use uuid::Uuid; // Ajoutez Deserializer

// --- Project Model ---
#[derive(Queryable, Selectable, Identifiable, Serialize, Deserialize, Debug, Clone, PartialEq)]
#[diesel(table_name = projects)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Project {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)] // Deserialize pour les payloads JSON
#[diesel(table_name = projects)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewProject {
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    // created_at et updated_at sont gérés par la DB (DEFAULT NOW())
}

// Struct pour AsChangeset lors des mises à jour de projets
#[derive(AsChangeset, Debug)] // Pas de Deserialize ici, elle est construite à partir du Payload
#[diesel(table_name = projects)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateProjectChangeset {
    pub name: Option<String>,
    pub color: Option<Option<String>>, // Pour distinguer "ne pas toucher" vs "mettre à NULL"
    pub updated_at: Option<NaiveDateTime>, // Toujours mis à jour
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
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Task {
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
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewTask {
    pub user_id: Uuid,
    pub project_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>, // La DB a un DEFAULT, mais on peut le surcharger
    pub due_date: Option<NaiveDate>,
    #[diesel(column_name = task_order)]
    pub order: Option<i32>,
}

#[derive(AsChangeset, Debug)] // Pas de Deserialize ici
#[diesel(table_name = tasks)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateTaskChangeset {
    pub project_id: Option<Option<Uuid>>,
    pub title: Option<String>,
    pub description: Option<Option<String>>,
    pub status: Option<String>,
    pub due_date: Option<Option<NaiveDate>>,
    #[diesel(column_name = task_order)]
    pub order: Option<Option<i32>>,
    pub updated_at: Option<NaiveDateTime>, // Toujours mis à jour
}

// --- Label Model ---
#[derive(Queryable, Selectable, Identifiable, Serialize, Deserialize, Debug, Clone, PartialEq)]
#[diesel(table_name = labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Label {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewLabel {
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
}

#[derive(AsChangeset, Debug)] // Pas de Deserialize ici
#[diesel(table_name = labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateLabelChangeset {
    pub name: Option<String>,
    pub color: Option<Option<String>>,
    pub updated_at: Option<NaiveDateTime>, // Toujours mis à jour
}

// --- TaskLabel Model (table de jointure) ---
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
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct TaskLabel {
    pub task_id: Uuid,
    pub label_id: Uuid,
}

#[derive(Insertable, Deserialize, Debug)] // Deserialize si vous avez un endpoint pour créer ça directement
#[diesel(table_name = task_labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewTaskLabelAssociation {
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
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct TimeEntry {
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
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewTimeEntry {
    pub user_id: Uuid,
    pub task_id: Uuid,
    pub start_time: NaiveDateTime,
    pub end_time: Option<NaiveDateTime>,
    pub duration_seconds: Option<i32>,
    pub is_pomodoro_session: Option<bool>, // La DB a un DEFAULT false
}

#[derive(AsChangeset, Debug)] // Pas de Deserialize ici
#[diesel(table_name = time_entries)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateTimeEntryChangeset {
    pub start_time: Option<NaiveDateTime>,
    pub end_time: Option<Option<NaiveDateTime>>,
    pub duration_seconds: Option<Option<i32>>,
    pub is_pomodoro_session: Option<bool>,
    pub updated_at: Option<NaiveDateTime>, // Toujours mis à jour
}

// --- Structs pour les DTOs de Payload (celles qui viennent du JSON) ---
// Ces structs sont celles que vous désérialisez depuis le corps des requêtes.
// Elles sont séparées des structs AsChangeset pour plus de clarté.

#[derive(Deserialize, Debug)]
pub struct CreateProjectPayload {
    pub name: String,
    pub color: Option<String>,
}

// Fonction helper pour désérialiser Option<Option<T>>
// où JSON null devient Some(None) et champ absent devient None.
fn deserialize_optional_nullable_string<'de, D>(
    deserializer: D,
) -> Result<Option<Option<String>>, D::Error>
where
    D: Deserializer<'de>,
{
    // D'abord, désérialiser comme Option<String>
    // Si c'est Some("valeur"), on retourne Some(Some("valeur"))
    // Si c'est None (parce que le JSON était `null`), on retourne Some(None)
    match Option::<String>::deserialize(deserializer) {
        Ok(Some(s)) => Ok(Some(Some(s))),
        Ok(None) => Ok(Some(None)), // JSON null devient Some(None)
        Err(e) => Err(e),
    }
}

#[derive(serde::Deserialize, Debug)]
pub struct UpdateProjectPayload {
    pub name: Option<String>,
    #[serde(
        deserialize_with = "deserialize_optional_nullable_string", // Utilise notre fonction custom
        default // `default` ici signifie que si la clé "color" est absente, le champ sera Option::None
    )]
    pub color: Option<Option<String>>, // Revient à Option<Option<String>>
}

#[derive(Deserialize, Debug)]
pub struct CreateTaskPayload {
    pub project_id: Option<Uuid>,
    pub title: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub due_date: Option<NaiveDate>,
    pub order: Option<i32>,
    // pub labels: Option<Vec<Uuid>>, // Si vous voulez associer des labels à la création
}

#[derive(Deserialize, Debug)]
pub struct UpdateTaskPayload {
    #[serde(default)]
    pub project_id: Option<serde_json::Value>, // Pour null vs absent
    pub title: Option<String>,
    #[serde(default)]
    pub description: Option<serde_json::Value>, // Pour null vs absent
    pub status: Option<String>,
    #[serde(default)]
    pub due_date: Option<serde_json::Value>, // Pour null vs absent
    #[serde(default)]
    pub order: Option<serde_json::Value>, // Pour null vs absent
}

#[derive(Deserialize, Debug)]
pub struct CreateLabelPayload {
    pub name: String,
    pub color: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateLabelPayload {
    pub name: Option<String>,
    #[serde(default)]
    pub color: Option<serde_json::Value>, // Pour null vs absent
}

#[derive(Deserialize, Debug)]
pub struct CreateTimeEntryPayload {
    pub task_id: Uuid,
    pub start_time: NaiveDateTime, // Attendre un timestamp ISO8601
    pub end_time: Option<NaiveDateTime>,
    pub duration_seconds: Option<i32>,
    pub is_pomodoro_session: Option<bool>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateTimeEntryPayload {
    pub start_time: Option<NaiveDateTime>,
    #[serde(default)]
    pub end_time: Option<serde_json::Value>,
    #[serde(default)]
    pub duration_seconds: Option<serde_json::Value>,
    pub is_pomodoro_session: Option<bool>,
}

// --- Structs pour les requêtes et réponses paginées (Exemple) ---
// Utilisé si vous implémentez la pagination pour les listes
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
} // Ou une autre valeur par défaut

#[derive(Serialize, Debug)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total_items: i64,
    pub total_pages: i64,
    pub page: i64,
    pub per_page: i64,
}
