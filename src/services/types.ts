/**
 * Central file for all application types and interfaces
 * Contains business entity definitions and DTO types
 */

/****************************
 * BUSINESS ENTITY INTERFACES
 ***************************/

/**
 * Represents a user project
 */
export interface Project {
  /** Unique project identifier */
  id: string;
  /** Owner user ID */
  user_id: string;
  /** Project name */
  name: string;
  /** Optional project color (hex format) */
  color?: string | null;
  /** Creation date (ISO string) */
  created_at: string;
  /** Last update date (ISO string) */
  updated_at: string;
}

/**
 * Represents a user label/tag
 */
export interface Label {
  /** Unique identifier */
  id: string;
  /** Owner user ID */
  user_id: string;
  /** Label name */
  name: string;
  /** Associated color (hex format) */
  color: string;
  /** Creation date (ISO string) */
  created_at: string;
  /** Last update date (ISO string) */
  updated_at: string;
}

/**
 * Represents a task with its associated labels
 */
export interface TaskWithLabels {
  /** Unique identifier */
  id: string;
  /** Owner user ID */
  user_id: string;
  /** Associated project ID (optional) */
  project_id: string | null;
  /** Task title */
  title: string;
  /** Detailed description (optional) */
  description: string | null;
  /** Current status (todo/inprogress/done) */
  status: string;
  /** Due date (optional, YYYY-MM-DD format) */
  due_date: string | null;
  /** Display order (optional) */
  order: number | null;
  /** Creation date (ISO string) */
  created_at: string;
  /** Last update date (ISO string) */
  updated_at: string;
  /** Array of associated labels */
  labels: Label[];
}

/****************************
 * API REQUEST DTO INTERFACES
 ***************************/

/**
 * Payload for project creation
 */
export interface CreateProjectPayload {
  /** Required project name */
  name: string;
  /** Optional color */
  color?: string | null;
}

/**
 * Payload for project updates
 */
export interface UpdateProjectData {
  /** New name (optional) */
  name?: string;
  /** New color (optional) */
  color?: string | null;
}

/**
 * Payload for label creation
 */
export interface CreateLabelPayload {
  /** Required label name */
  name: string;
  /** Optional color */
  color?: string | null;
}

/**
 * Payload for label updates
 */
export interface UpdateLabelData {
  /** New name (optional) */
  name?: string;
  /** New color (optional) */
  color?: string | null | undefined;
}

/**
 * Payload for task creation
 */
export interface CreateTaskPayload {
  /** Associated project ID (optional) */
  project_id?: string | null;
  /** Required task title */
  title: string;
  /** Optional description */
  description?: string | null;
  /** Initial status (optional, default: 'todo') */
  status?: string;
  /** Optional due date */
  due_date?: string | null;
  /** Initial order (optional) */
  order?: number | null;
}

/**
 * Payload for task updates
 */
export interface UpdateTaskData {
  /** New project ID (optional) */
  project_id?: string | null | undefined;
  /** New title (optional) */
  title?: string;
  /** New description (optional) */
  description?: string | null | undefined;
  /** New status (optional) */
  status?: string;
  /** New due date (optional) */
  due_date?: string | null | undefined;
  /** New order (optional) */
  order?: number | null | undefined;
}

export interface TimeEntry {
  id: string; // UUID
  user_id: string; // UUID
  task_id: string; // UUID
  start_time: string; // ISO 8601 DateTime string (e.g., "2023-10-27T10:00:00Z")
  end_time: string | null; // ISO 8601 DateTime string or null
  duration_seconds: number | null;
  is_pomodoro_session: boolean;
  created_at: string; // ISO 8601 DateTime string
  updated_at: string; // ISO 8601 DateTime string
}

// Correspond à NewTimeEntry dans models.rs (backend) pour la création
// et CreateTimeEntryPayload pour le frontend
export interface CreateTimeEntryPayload {
  task_id: string; // UUID
  start_time: string; // ISO 8601 DateTime string (sera new Date().toISOString())
  end_time: string;   // ISO 8601 DateTime string (sera new Date().toISOString())
  duration_seconds: number;
  is_pomodoro_session?: boolean; // Optionnel, le backend a un défaut
}

// Correspond à UpdateTimeEntryPayload (frontend) et UpdateTimeEntryChangeset (backend)
export interface UpdateTimeEntryData {
  start_time?: string;
  end_time?: string | null; // Permet de mettre à null explicitement
  duration_seconds?: number | null;
  is_pomodoro_session?: boolean;
  // updated_at est géré par le backend
}

// Types pour les réponses du backend (doivent correspondre aux structs Rust)
export interface TimeByProjectStat {
  project_id: string; // Uuid
  project_name: string;
  total_duration_seconds: number; // Reçu comme i64 de Rust, sera number en JS/TS
}

export interface ProductivityTrendPoint {
  date_point: string; // NaiveDate de Rust, sera une chaîne YYYY-MM-DD
  total_duration_seconds: number; // i64 de Rust, number en JS/TS
}

// Type pour les paramètres de requête
export interface AnalyticsQueryArgs {
  period?: 'this_week' | 'last_7_days' | 'this_month' | 'last_30_days' | 'custom';
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
}

/****************************
 * API RESPONSE INTERFACES
 ***************************/

/**
 * Standard response for delete operations
 */
export interface DeleteSuccessResponse {
  /** Response status */
  status: "success";
  /** Descriptive message */
  message: string;
}

/**
 * Filters for task fetching
 */
export interface FetchTasksFilters {
  /** Filter by project ID */
  project_id?: string;
  /** Filter by status */
  status?: string;
}

/**
 * Response for adding label to task
 */
export interface AddLabelToTaskResponse {
  /** Response status */
  status: "success";
  /** Descriptive message */
  message: string;
  /** Target task ID */
  task_id: string;
  /** Added label ID */
  label_id: string;
}

/****************************
 * UTILITY TYPES
 ***************************/

/**
 * Type for validation errors
 */
export type ValidationErrors = {
  [key: string]: string[];
};

/**
 * Type for sorting options
 */
export type SortOptions = {
  field: string;
  direction: 'asc' | 'desc';
};

/**
 * Type for paginated API responses
 */
export type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

