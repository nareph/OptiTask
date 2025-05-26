// OptiTask/backend-api/src/models.rs

use crate::schema::{labels, projects, task_labels, tasks, time_entries}; // Importez vos tables du schéma
use chrono::{NaiveDate, NaiveDateTime}; // Pour les types de date et d'heure
use diesel::prelude::*; // Traits courants de Diesel (Queryable, Insertable, etc.)
use serde::{Deserialize, Serialize}; // Pour la sérialisation/désérialisation JSON
use uuid::Uuid; // Pour le type UUID

// --- Project Model ---
#[derive(Queryable, Selectable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = projects)] // Lie cette struct à la table 'projects' du schéma
#[diesel(check_for_backend(diesel::pg::Pg))] // Spécifie le backend DB pour la vérification
pub struct Project {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>, // Optionnel car nullable dans la DB
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = projects)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewProject {
    // Pas d'id ici, car il est généré par la DB (DEFAULT uuid_generate_v4())
    // Pas de created_at/updated_at non plus, car ils ont des valeurs DEFAULT NOW()
    pub user_id: Uuid, // Ce sera l'ID de l'utilisateur authentifié
    pub name: String,
    pub color: Option<String>,
}

// Optionnel: pour les mises à jour, si vous voulez permettre de ne mettre à jour que certains champs
#[derive(AsChangeset, Deserialize, Debug)]
#[diesel(table_name = projects)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateProject {
    pub name: Option<String>,
    pub color: Option<Option<String>>, // Double Option pour pouvoir passer explicitement NULL
                                       // updated_at sera géré par un trigger ou manuellement lors de la mise à jour
}

// --- Task Model ---
#[derive(
    Queryable, Selectable, Identifiable, Associations, Serialize, Deserialize, Debug, Clone,
)]
#[diesel(table_name = tasks)]
#[diesel(belongs_to(Project, foreign_key = project_id))] // Définit la relation avec Project
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Task {
    pub id: Uuid,
    pub user_id: Uuid,
    pub project_id: Option<Uuid>, // Optionnel car la tâche peut ne pas être liée à un projet
    pub title: String,
    pub description: Option<String>,
    pub status: String,              // ex: "todo", "inprogress", "done"
    pub due_date: Option<NaiveDate>, // Utilise NaiveDate pour les dates sans heure
    #[diesel(column_name = task_order)] // Mappe le champ Rust 'order' à la colonne 'task_order'
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
    // La DB a un DEFAULT 'todo' pour status, mais c'est bien de pouvoir le spécifier
    pub status: Option<String>,
    pub due_date: Option<NaiveDate>,
    #[diesel(column_name = task_order)]
    pub order: Option<i32>,
    // created_at et updated_at sont gérés par la DB (DEFAULT ou trigger)
}

// Optionnel: pour les mises à jour
#[derive(AsChangeset, Deserialize, Debug)]
#[diesel(table_name = tasks)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateTask {
    pub project_id: Option<Option<Uuid>>, // Permet de mettre à NULL ou de changer
    pub title: Option<String>,
    pub description: Option<Option<String>>,
    pub status: Option<String>,
    pub due_date: Option<Option<NaiveDate>>,
    #[diesel(column_name = task_order)]
    pub order: Option<Option<i32>>,
    // updated_at sera géré par un trigger ou manuellement
}

// --- Label Model (mis à jour avec timestamps) ---
#[derive(Queryable, Selectable, Identifiable, Serialize, Deserialize, Debug, Clone)]
#[diesel(table_name = labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct Label {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    pub created_at: NaiveDateTime, // Ajouté
    pub updated_at: NaiveDateTime, // Ajouté
}

#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewLabel {
    pub user_id: Uuid,
    pub name: String,
    pub color: Option<String>,
    // created_at et updated_at sont gérés par la DB (DEFAULT ou trigger)
}

#[derive(AsChangeset, Deserialize, Debug)]
#[diesel(table_name = labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateLabel {
    pub name: Option<String>,
    pub color: Option<Option<String>>,
    // updated_at sera géré par un trigger ou manuellement
}

// --- TaskLabel Model (table de jointure) ---
// Une struct Queryable pour TaskLabel peut être utile si vous voulez charger les labels d'une tâche
// avec leurs informations de jointure, ou lister toutes les associations.
#[derive(
    Queryable, Selectable, Associations, Identifiable, Serialize, Deserialize, Debug, Clone,
)]
#[diesel(table_name = task_labels)]
#[diesel(belongs_to(Task))]
#[diesel(belongs_to(Label))]
#[diesel(primary_key(task_id, label_id))] // Clé primaire composite
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct TaskLabel {
    // Renommé de NewTaskLabel pour être un modèle complet
    pub task_id: Uuid,
    pub label_id: Uuid,
}

// Pour insérer une nouvelle association Task-Label
#[derive(Insertable, Deserialize, Debug)]
#[diesel(table_name = task_labels)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct NewTaskLabelAssociation {
    // Nom plus descriptif pour l'insertion
    pub task_id: Uuid,
    pub label_id: Uuid,
}

// --- TimeEntry Model (mis à jour avec timestamps) ---
#[derive(
    Queryable, Selectable, Identifiable, Associations, Serialize, Deserialize, Debug, Clone,
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
    pub created_at: NaiveDateTime, // Ajouté
    pub updated_at: NaiveDateTime, // Ajouté
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
    pub is_pomodoro_session: Option<bool>, // DEFAULT false dans la DB, donc Option ici
                                           // created_at et updated_at sont gérés par la DB (DEFAULT ou trigger)
}

#[derive(AsChangeset, Deserialize, Debug)]
#[diesel(table_name = time_entries)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct UpdateTimeEntry {
    // On ne met généralement pas à jour task_id ou user_id d'une time_entry existante.
    // On pourrait permettre de mettre à jour start_time, end_time, duration_seconds.
    pub start_time: Option<NaiveDateTime>,
    pub end_time: Option<Option<NaiveDateTime>>, // Permet de mettre à NULL
    pub duration_seconds: Option<Option<i32>>,
    pub is_pomodoro_session: Option<bool>,
    // updated_at sera géré par un trigger ou manuellement
}

// --- Structs pour les requêtes et réponses paginées (Exemple) ---
// Vous pourriez en avoir besoin plus tard pour lister des items
#[derive(Deserialize, Debug)]
pub struct PaginationParams {
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Serialize, Debug)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total_items: i64,
    pub total_pages: i64,
    pub page: i64,
    pub per_page: i64,
}
