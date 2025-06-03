// src/services/timeEntryApi.ts
import { Session } from "next-auth";
import { ApiError, apiRequest, ApiResponseWithMessage } from "./common";
import { CreateTimeEntryPayload, TimeEntry, UpdateTimeEntryData } from "./types";

// --- FONCTIONS API POUR LES TIME ENTRIES ---

/**
 * Récupère toutes les entrées de temps pour l'utilisateur authentifié.
 * Des filtres (task_id, date_from, date_to) peuvent être ajoutés via query params.
 */
export async function fetchTimeEntries(
  session: Session | null,
  filters?: { task_id?: string; date_from?: string; date_to?: string }
): Promise<TimeEntry[] | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for fetchTimeEntries" };
  }
  const queryParams = new URLSearchParams();
  if (filters?.task_id) queryParams.append('task_id', filters.task_id);
  if (filters?.date_from) queryParams.append('date_from', filters.date_from); // Assurez-vous que le backend attend ce format
  if (filters?.date_to) queryParams.append('date_to', filters.date_to);
  
  const queryString = queryParams.toString();
  return apiRequest<TimeEntry[]>(
    `/time-entries${queryString ? '?' + queryString : ''}`,
    { method: 'GET' },
    session
  );
}

/**
 * Crée une nouvelle entrée de temps.
 */
export async function createTimeEntry(
  session: Session | null,
  timeEntryData: CreateTimeEntryPayload
): Promise<TimeEntry | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for createTimeEntry" };
  }
  // Le backend attend `is_pomodoro_session` comme `Option<bool>`,
  // donc si `undefined`, c'est ok, le backend utilisera son défaut (false).
  // Si `true` ou `false` est envoyé, ça sera pris en compte.
  return apiRequest<TimeEntry>(
    '/time-entries',
    {
      method: 'POST',
      body: JSON.stringify(timeEntryData),
    },
    session
  );
}

/**
 * Récupère une entrée de temps spécifique par son ID.
 */
export async function fetchTimeEntryById(
  session: Session | null,
  entryId: string
): Promise<TimeEntry | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for fetchTimeEntryById" };
  }
  return apiRequest<TimeEntry>(`/time-entries/${entryId}`, { method: 'GET' }, session);
}

/**
 * Met à jour une entrée de temps existante.
 * `timeEntryData` ne doit contenir que les champs à mettre à jour.
 */
export async function updateTimeEntry(
  session: Session | null,
  entryId: string,
  timeEntryData: UpdateTimeEntryData
): Promise<TimeEntry | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for updateTimeEntry" };
  }

  // Construire le payload en s'assurant que seuls les champs définis sont envoyés
  // et que `null` est correctement géré pour les champs Option<Option<T>> du backend.
  const payloadForBackend: Partial<UpdateTimeEntryData> = {};
  if (timeEntryData.start_time !== undefined) payloadForBackend.start_time = timeEntryData.start_time;
  
  // Pour end_time et duration_seconds, si on veut pouvoir les mettre à NULL via l'API:
  if (Object.prototype.hasOwnProperty.call(timeEntryData, 'end_time')) {
    payloadForBackend.end_time = timeEntryData.end_time; // Sera null si timeEntryData.end_time est null
  }
  if (Object.prototype.hasOwnProperty.call(timeEntryData, 'duration_seconds')) {
    payloadForBackend.duration_seconds = timeEntryData.duration_seconds;
  }
  if (timeEntryData.is_pomodoro_session !== undefined) payloadForBackend.is_pomodoro_session = timeEntryData.is_pomodoro_session;

  return apiRequest<TimeEntry>(
    `/time-entries/${entryId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payloadForBackend),
    },
    session
  );
}

/**
 * Supprime une entrée de temps.
 */
export async function deleteTimeEntry(
  session: Session | null,
  entryId: string
): Promise<ApiResponseWithMessage | ApiError> { // Utilisation de ApiResponseWithMessage de common.ts
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for deleteTimeEntry" };
  }
  return apiRequest<ApiResponseWithMessage>(
      `/time-entries/${entryId}`,
      { method: 'DELETE' },
      session
  );
}