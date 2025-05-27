// src/lib/apiClient.ts
import { Session } from "next-auth";

const API_BASE_URL = '/api/rust';

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

// DTO pour la mise à jour de projet (ce que le frontend envoie à la fonction updateProject)
export interface UpdateProjectData { // Renommé pour clarifier son rôle
  name?: string;
  color?: string | null; // string | null | undefined (si la clé est omise)
}

// Ce que le backend attend (correspond à UpdateProjectPayload dans Rust)
// C'est ce que nous construisons dans la fonction updateProject
interface BackendUpdateProjectPayload {
    name?: string;
    color?: string | null; // Le backend gère `null` pour Option<Option<String>> via deserialize_with
}


export interface ApiError {
  status: "error";
  statusCode: number;
  message: string;
}

export function isApiError(obj: unknown): obj is ApiError {
  if (typeof obj === 'object' && obj !== null) {
    const potentialError = obj as Partial<ApiError>;
    return (
      potentialError.status === "error" &&
      typeof potentialError.statusCode === 'number' &&
      typeof potentialError.message === 'string'
    );
  }
  return false;
}

export async function fetchProjects(session: Session | null): Promise<Project[] | ApiError> {
    console.log("apiClient:fetchProjects - Session object:", JSON.stringify(session, null, 2));
console.log("apiClient:fetchProjects - Attempting to use user ID:", session?.user.id);
  if (!session?.user?.id) {
    console.error("fetchProjects: No session or user ID found");
    return { status: "error", statusCode: 401, message: "User not authenticated" };
  }

  let response: Response | undefined;
  try {
    response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': session.user.id,
      },
    });
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
        }
        console.error(`API Error (${response.status}) fetching projects:`, errorData);
      } catch (jsonError) {
        console.warn(`API Error (${response.status}), but failed to parse error body as JSON:`, jsonError);
      }
      return { status: "error", statusCode: response.status, message: errorMessage };
    }
    return await response.json();
  } catch (error) {
    console.error("Network or other error in fetchProjects:", error);
    const statusCode = response?.status || 500;
    let message = "Network error or unexpected issue fetching projects.";
    if (error instanceof Error) { message = error.message; }
    else if (typeof error === 'string') { message = error; }
    return { status: "error", statusCode: statusCode, message: message };
  }
}

export async function createProject(session: Session | null, projectData: CreateProjectPayload): Promise<Project | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated" };
  }
  const payloadForBackend = {
    name: projectData.name,
    color: projectData.color === undefined ? null : projectData.color,
  };
  let response: Response | undefined;
  try {
    response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': session.user.id,
      },
      body: JSON.stringify(payloadForBackend),
    });
    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
        }
        console.error(`API Error (${response.status}) creating project:`, errorData);
      } catch (jsonError) {
        console.warn(`API Error (${response.status}) creating project, but failed to parse error body as JSON:`, jsonError);
      }
      return { status: "error", statusCode: response.status, message: errorMessage };
    }
    return await response.json();
  } catch (error) {
    console.error("Network or other error in createProject:", error);
    const statusCode = response?.status || 500;
    let message = "Network error or unexpected issue creating project.";
     if (error instanceof Error) { message = error.message; }
    else if (typeof error === 'string') { message = error; }
    return { status: "error", statusCode: statusCode, message: message };
  }
}

// Modifié ici: projectData est de type UpdateProjectData
export async function updateProject(
  session: Session | null,
  projectId: string,
  projectData: UpdateProjectData // Utilise le DTO renommé
): Promise<Project | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated" };
  }

  // Construire le payload pour le backend avec un typage explicite
  const payloadForBackend: BackendUpdateProjectPayload = {};

  if (projectData.name !== undefined) {
    payloadForBackend.name = projectData.name;
  }
  // La clé 'color' sera ajoutée à payloadForBackend SEULEMENT si elle est définie dans projectData
  // (c'est-à-dire, pas undefined). Si projectData.color est null, payloadForBackend.color sera null.
  // Si projectData.color est une chaîne, payloadForBackend.color sera cette chaîne.
  if (Object.prototype.hasOwnProperty.call(projectData, 'color')) { // Vérifie si la clé 'color' existe sur l'objet projectData
    payloadForBackend.color = projectData.color; // projectData.color est string | null | undefined. S'il est undefined, on ne veut pas l'envoyer.
                                                 // Mais si la clé existe et est explicitement `null`, on l'envoie.
                                                 // Ici, `projectData.color` peut être `string | null | undefined`.
                                                 // Si `undefined`, la clé n'est pas envoyée au backend (bien).
                                                 // Si `string | null`, la clé est envoyée au backend (bien).
                                                 // Pour être plus explicite avec le type BackendUpdateProjectPayload qui attend string | null pour color:
    if (projectData.color === undefined) {
        // Ne rien faire, la clé 'color' ne sera pas dans payloadForBackend, ce qui est correct
        // si on veut que le backend ne la touche pas.
        // Cependant, notre deserialize_with dans Rust s'attend à ce que l'absence de clé soit `None` (externe).
        // Et `null` soit `Some(None)` (interne).
        // Donc, si la clé est absente (projectData.color === undefined), on ne doit RIEN envoyer pour `color`.
        // C'est géré en ne l'ajoutant pas à payloadForBackend.
    } else {
        payloadForBackend.color = projectData.color; // Ici projectData.color est string | null
    }
  }


  let response: Response | undefined;
  try {
    // N'envoyer que les champs qui ont été explicitement fournis (pas undefined)
    // JSON.stringify omettra les clés avec des valeurs undefined.
    const bodyToSend = JSON.stringify(payloadForBackend);
    console.log("Sending update payload:", bodyToSend); // Pour déboguer ce qui est envoyé

    response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': session.user.id,
      },
      body: bodyToSend,
    });

    if (!response.ok) {
      // ... (gestion d'erreur comme dans les autres fonctions)
      let errorMessage = `API error updating project (${response.status})`;
      try {
        const errorData = await response.json();
        if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
        }
        console.error(`API Error (${response.status}) updating project:`, errorData);
      } catch (jsonError) {
        console.warn(`API Error (${response.status}) updating project, but failed to parse error body as JSON:`, jsonError);
      }
      return { status: "error", statusCode: response.status, message: errorMessage };
    }
    return await response.json();
  } catch (error) {
    // ... (gestion d'erreur comme dans les autres fonctions)
    console.error("Network or other error in updateProject:", error);
    const statusCode = response?.status || 500;
    let message = "Network error or unexpected issue updating project.";
    if (error instanceof Error) { message = error.message; }
    else if (typeof error === 'string') { message = error; }
    return { status: "error", statusCode: statusCode, message: message };
  }
}

interface DeleteResponse {
    status: "success";
    message: string;
}

export async function deleteProject(session: Session | null, projectId: string ): Promise<DeleteResponse | ApiError> {
  // ... (code existant, déjà correct sans 'any' problématique)
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated" };
  }

  let response: Response | undefined;
  try {
    response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': session.user.id,
      },
    });

    if (!response.ok) {
      let errorMessage = `API error deleting project (${response.status})`;
      try {
        const errorData = await response.json();
         if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
        }
        console.error(`API Error (${response.status}) deleting project:`, errorData);
      } catch (jsonError) {
        console.warn(`API Error (${response.status}) deleting project, but failed to parse error body as JSON:`, jsonError);
      }
      return { status: "error", statusCode: response.status, message: errorMessage };
    }
    if (response.status === 204) {
        return { status: "success", message: "Project deleted successfully (no content)" };
    }
    return await response.json();
  } catch (error) {
    console.error("Network or other error in deleteProject:", error);
    const statusCode = response?.status || 500;
    let message = "Network error or unexpected issue deleting project.";
    if (error instanceof Error) { message = error.message; }
    else if (typeof error === 'string') { message = error; }
    return { status: "error", statusCode: statusCode, message: message };
  }
}