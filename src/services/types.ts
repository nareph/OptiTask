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