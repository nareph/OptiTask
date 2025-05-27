// src/services/taskApi.ts
import { Session } from "next-auth";
import { ApiError, apiRequest, isApiError } from "./common"; // Importer depuis common.ts

// --- INTERFACES SPÉCIFIQUES AUX TÂCHES ---
export interface Task {
  id: string; // UUID
  user_id: string; // UUID
  project_id: string | null; // UUID
  title: string;
  description: string | null;
  status: string; // ex: "todo", "inprogress", "done"
  due_date: string | null; // NaiveDate (YYYY-MM-DD string)
  order: number | null; // task_order
  created_at: string; // NaiveDateTime (ISO 8601 string)
  updated_at: string;
}

// Ce que le formulaire de création envoie à la fonction createTask
export interface CreateTaskPayload {
  project_id?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  due_date?: string | null;
  order?: number | null;
}

// Ce que le formulaire d'édition envoie à la fonction updateTask
export interface UpdateTaskData {
  project_id?: string | null | undefined; // undefined pour ne pas envoyer, null pour mettre à null
  title?: string;
  description?: string | null | undefined;
  status?: string;
  due_date?: string | null | undefined;
  order?: number | null | undefined;
}

// Ce qui est réellement envoyé au backend pour la mise à jour
// Correspond à UpdateTaskPayload de Rust qui utilise deserialize_with pour les Option<Option<T>>
interface BackendUpdateTaskPayload {
    project_id?: string | null;
    title?: string;
    description?: string | null;
    status?: string;
    due_date?: string | null;
    order?: number | null;
}

export interface FetchTasksFilters {
    project_id?: string;
    status?: string;
    // Ajoutez d'autres filtres si nécessaire (ex: date range pour due_date)
}

interface DeleteSuccessResponse {
    status: "success";
    message: string;
}


// --- FONCTIONS API POUR LES TÂCHES ---

export async function fetchTasks(session: Session | null, filters?: FetchTasksFilters): Promise<Task[] | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for fetchTasks" };
  }

  const queryParams = new URLSearchParams();
  if (filters?.project_id) queryParams.append('project_id', filters.project_id);
  if (filters?.status) queryParams.append('status', filters.status);
  const queryString = queryParams.toString();
  
  return apiRequest<Task[]>(
    `/tasks${queryString ? '?' + queryString : ''}`,
    { method: 'GET' },
    session
  );
}

export async function createTask(session: Session | null, taskData: CreateTaskPayload): Promise<Task | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for createTask" };
  }

  // Assurer que les champs optionnels qui sont undefined deviennent null pour le backend Rust
  // car le backend NewTask s'attend à Option<T>, où `null` est valide.
  const payloadForBackend = {
    title: taskData.title, // title est requis
    project_id: taskData.project_id === undefined ? null : taskData.project_id,
    description: taskData.description === undefined ? null : taskData.description,
    status: taskData.status === undefined ? null : taskData.status,
    due_date: taskData.due_date === undefined ? null : taskData.due_date,
    order: taskData.order === undefined ? null : taskData.order,
  };

  return apiRequest<Task>(
    '/tasks',
    {
      method: 'POST',
      body: JSON.stringify(payloadForBackend),
    },
    session
  );
}

export async function updateTask(session: Session | null, taskId: string, taskData: UpdateTaskData): Promise<Task | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for updateTask" };
  }

  const payloadForBackend: BackendUpdateTaskPayload = {};
  if (taskData.title !== undefined) payloadForBackend.title = taskData.title;
  if (taskData.status !== undefined) payloadForBackend.status = taskData.status;

  // Gérer les champs qui peuvent être explicitement null ou absents
  // pour correspondre à Option<Option<T>> dans Rust avec deserialize_with
  if (Object.prototype.hasOwnProperty.call(taskData, 'project_id')) payloadForBackend.project_id = taskData.project_id;
  if (Object.prototype.hasOwnProperty.call(taskData, 'description')) payloadForBackend.description = taskData.description;
  if (Object.prototype.hasOwnProperty.call(taskData, 'due_date')) payloadForBackend.due_date = taskData.due_date;
  if (Object.prototype.hasOwnProperty.call(taskData, 'order')) payloadForBackend.order = taskData.order;

  return apiRequest<Task>(
    `/tasks/${taskId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payloadForBackend),
    },
    session
  );
}

export async function deleteTask(session: Session | null, taskId: string): Promise<DeleteSuccessResponse | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for deleteTask" };
  }
  const result = await apiRequest<DeleteSuccessResponse | object>( // Peut retourner {} pour 204
      `/tasks/${taskId}`,
      { method: 'DELETE' },
      session
  );
  if (Object.keys(result).length === 0 && !isApiError(result)) { // isApiError importé de common
      return { status: "success", message: "Task deleted successfully." };
  }
  return result as DeleteSuccessResponse | ApiError;
}