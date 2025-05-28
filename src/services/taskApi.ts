// src/services/taskApi.ts
import { Session } from "next-auth";
import { ApiError, apiRequest } from "./common";
import { DeleteSuccessResponse, Label } from "./labelApi"; // Importer Label car TaskApiResponse l'utilise

// --- INTERFACES SPÉCIFIQUES AUX TÂCHES ---

// C'est ce que le backend retourne (Task avec ses labels)
// Correspond à TaskApiResponse dans Rust
export interface TaskWithLabels {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  order: number | null;
  created_at: string;
  updated_at: string;
  labels: Label[]; // Labels associés
}

export interface CreateTaskPayload {
  project_id?: string | null;
  title: string;
  description?: string | null;
  status?: string;
  due_date?: string | null;
  order?: number | null;
  // Note: Les labels ne sont pas ajoutés à la création ici, mais via taskLabelApi
}

export interface UpdateTaskData {
  project_id?: string | null | undefined;
  title?: string;
  description?: string | null | undefined;
  status?: string;
  due_date?: string | null | undefined;
  order?: number | null | undefined;
  // Les labels sont gérés séparément via taskLabelApi
}

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
}

// --- FONCTIONS API POUR LES TÂCHES ---

export async function fetchTasks(session: Session | null, filters?: FetchTasksFilters): Promise<TaskWithLabels[] | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for fetchTasks" };
  }
  const queryParams = new URLSearchParams();
  if (filters?.project_id) queryParams.append('project_id', filters.project_id);
  if (filters?.status) queryParams.append('status', filters.status);
  const queryString = queryParams.toString();
  
  return apiRequest<TaskWithLabels[]>(
    `/tasks${queryString ? '?' + queryString : ''}`,
    { method: 'GET' },
    session
  );
}

export async function createTask(session: Session | null, taskData: CreateTaskPayload): Promise<TaskWithLabels | ApiError> {
  if (!session?.user?.id) { /* ... */ }
  const payloadForBackend = {
    title: taskData.title,
    project_id: taskData.project_id === undefined ? null : taskData.project_id,
    description: taskData.description === undefined ? null : taskData.description,
    status: taskData.status === undefined ? null : taskData.status, // Le backend mettra 'todo' par défaut si null
    due_date: taskData.due_date === undefined ? null : taskData.due_date,
    order: taskData.order === undefined ? null : taskData.order,
  };
  return apiRequest<TaskWithLabels>( '/tasks', { method: 'POST', body: JSON.stringify(payloadForBackend) }, session );
}

export async function updateTask(session: Session | null, taskId: string, taskData: UpdateTaskData): Promise<TaskWithLabels | ApiError> {
  if (!session?.user?.id) { /* ... */ }
  const payloadForBackend: BackendUpdateTaskPayload = {};
  if (taskData.title !== undefined) payloadForBackend.title = taskData.title;
  if (taskData.status !== undefined) payloadForBackend.status = taskData.status;
  if (Object.prototype.hasOwnProperty.call(taskData, 'project_id')) payloadForBackend.project_id = taskData.project_id;
  if (Object.prototype.hasOwnProperty.call(taskData, 'description')) payloadForBackend.description = taskData.description;
  if (Object.prototype.hasOwnProperty.call(taskData, 'due_date')) payloadForBackend.due_date = taskData.due_date;
  if (Object.prototype.hasOwnProperty.call(taskData, 'order')) payloadForBackend.order = taskData.order;
  
  return apiRequest<TaskWithLabels>( `/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(payloadForBackend) }, session );
}

export async function deleteTask(session: Session | null, taskId: string): Promise<DeleteSuccessResponse | ApiError> {
  if (!session?.user?.id) { /* ... */ }
  return apiRequest<DeleteSuccessResponse>( `/tasks/${taskId}`, { method: 'DELETE' }, session );
}