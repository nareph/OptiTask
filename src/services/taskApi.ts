// src/services/taskApi.ts
import { Session } from "next-auth";
import { ApiError, apiRequest } from "./common";
import { CreateTaskPayload, DeleteSuccessResponse, FetchTasksFilters, TaskWithLabels, UpdateTaskData } from "./types";

interface BackendUpdateTaskPayload {
  project_id?: string | null;
  title?: string;
  description?: string | null;
  status?: string;
  due_date?: string | null;
  order?: number | null;
}

// Interface pour la réponse paginée du backend
interface PaginatedTasksResponse {
  items: TaskWithLabels[];
  total_items: number;
  total_pages: number;
  page: number;
  per_page: number;
}

// Interface étendue pour les filtres incluant la pagination
interface FetchTasksFiltersWithPagination extends FetchTasksFilters {
  page?: number;
  per_page?: number;
}

// --- FONCTIONS API POUR LES TÂCHES ---

export async function fetchTasks(
  session: Session | null, 
  filters?: FetchTasksFiltersWithPagination
): Promise<PaginatedTasksResponse | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for fetchTasks" };
  }
  
  const queryParams = new URLSearchParams();
  if (filters?.project_id) queryParams.append('project_id', filters.project_id);
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.per_page) queryParams.append('per_page', filters.per_page.toString());
  
  const queryString = queryParams.toString();
  
  return apiRequest<PaginatedTasksResponse>(
    `/tasks${queryString ? '?' + queryString : ''}`,
    { method: 'GET' },
    session
  );
}

// Fonction utilitaire pour récupérer toutes les tâches (sans pagination)
export async function fetchAllTasks(
  session: Session | null, 
  filters?: FetchTasksFilters
): Promise<TaskWithLabels[] | ApiError> {
  const result = await fetchTasks(session, { ...filters, per_page: 1000 }); // Récupère jusqu'à 1000 tâches
  
  if ('status' in result && result.status === 'error') {
    return result;
  }
  
  return (result as PaginatedTasksResponse).items;
}

export async function getTask(session: Session | null, taskId: string): Promise<TaskWithLabels | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for getTask" };
  }
  
  return apiRequest<TaskWithLabels>(
    `/tasks/${taskId}`,
    { method: 'GET' },
    session
  );
}

export async function createTask(session: Session | null, taskData: CreateTaskPayload): Promise<TaskWithLabels | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for createTask" };
  }
  
  const payloadForBackend = {
    title: taskData.title,
    project_id: taskData.project_id === undefined ? null : taskData.project_id,
    description: taskData.description === undefined ? null : taskData.description,
    status: taskData.status === undefined ? null : taskData.status, // Le backend mettra 'todo' par défaut si null
    due_date: taskData.due_date === undefined ? null : taskData.due_date,
    order: taskData.order === undefined ? null : taskData.order,
  };
  
  return apiRequest<TaskWithLabels>(
    '/tasks',
    { method: 'POST', body: JSON.stringify(payloadForBackend) },
    session
  );
}

export async function updateTask(session: Session | null, taskId: string, taskData: UpdateTaskData): Promise<TaskWithLabels | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for updateTask" };
  }
  
  const payloadForBackend: BackendUpdateTaskPayload = {};
  if (taskData.title !== undefined) payloadForBackend.title = taskData.title;
  if (taskData.status !== undefined) payloadForBackend.status = taskData.status;
  if (Object.prototype.hasOwnProperty.call(taskData, 'project_id')) payloadForBackend.project_id = taskData.project_id;
  if (Object.prototype.hasOwnProperty.call(taskData, 'description')) payloadForBackend.description = taskData.description;
  if (Object.prototype.hasOwnProperty.call(taskData, 'due_date')) payloadForBackend.due_date = taskData.due_date;
  if (Object.prototype.hasOwnProperty.call(taskData, 'order')) payloadForBackend.order = taskData.order;
  
  return apiRequest<TaskWithLabels>(
    `/tasks/${taskId}`,
    { method: 'PUT', body: JSON.stringify(payloadForBackend) },
    session
  );
}

export async function toggleTaskCompletion(session: Session | null, taskId: string): Promise<TaskWithLabels | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for toggleTaskCompletion" };
  }
  
  return apiRequest<TaskWithLabels>(
    `/tasks/${taskId}/toggle-completion`,
    { method: 'PUT' },
    session
  );
}

export async function deleteTask(session: Session | null, taskId: string): Promise<DeleteSuccessResponse | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for deleteTask" };
  }
  
  return apiRequest<DeleteSuccessResponse>(
    `/tasks/${taskId}`,
    { method: 'DELETE' },
    session
  );
}