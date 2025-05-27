import { Session } from "next-auth";
import { ApiError, apiRequest, isApiError } from "./common"; // Importer depuis common.ts

// --- INTERFACES SPÉCIFIQUES AUX PROJETS ---
export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  color?: string | null;
}

export interface UpdateProjectData {
  name?: string;
  color?: string | null;
}

interface BackendUpdateProjectPayload { // Interne à ce module si nécessaire
    name?: string;
    color?: string | null;
}

// --- FONCTIONS API POUR LES PROJETS ---

export async function fetchProjects(session: Session | null): Promise<Project[] | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for fetchProjects" };
  }
  return apiRequest<Project[]>('/projects', { method: 'GET' }, session);
}

export async function createProject(session: Session | null, projectData: CreateProjectPayload): Promise<Project | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for createProject" };
  }
  const payloadForBackend = {
    name: projectData.name,
    color: projectData.color === undefined ? null : projectData.color,
  };
  return apiRequest<Project>(
    '/projects',
    {
      method: 'POST',
      body: JSON.stringify(payloadForBackend),
    },
    session
  );
}

export async function updateProject(session: Session | null, projectId: string, projectData: UpdateProjectData): Promise<Project | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for updateProject" };
  }
  const payloadForBackend: BackendUpdateProjectPayload = {};
  if (projectData.name !== undefined) payloadForBackend.name = projectData.name;
  if (Object.prototype.hasOwnProperty.call(projectData, 'color')) {
      payloadForBackend.color = projectData.color;
  }

  return apiRequest<Project>(
    `/projects/${projectId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payloadForBackend),
    },
    session
  );
}

interface DeleteSuccessResponse { // Type spécifique pour la réponse de suppression
    status: "success";
    message: string;
}

export async function deleteProject(session: Session | null, projectId: string): Promise<DeleteSuccessResponse | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for deleteProject" };
  }
  // La fonction apiRequest gère le 204, mais on peut vouloir un type de retour plus spécifique
  const result = await apiRequest<DeleteSuccessResponse | object>( // Peut retourner {} pour 204
      `/projects/${projectId}`,
      { method: 'DELETE' },
      session
  );

  // Si apiRequest retourne {} pour 204, on le transforme en DeleteSuccessResponse
  if (Object.keys(result).length === 0 && !isApiError(result)) {
      return { status: "success", message: "Project deleted successfully." };
  }
  return result as DeleteSuccessResponse | ApiError; // Caster si on est sûr du type de succès
}