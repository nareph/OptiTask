// src/services/labelApi.ts
import { Session } from "next-auth";
import { ApiError, apiRequest } from "./common";
import { CreateLabelPayload, DeleteSuccessResponse, Label, UpdateLabelData } from "./types";


interface BackendUpdateLabelPayload {
    name?: string;
    color?: string | null;
}

// --- FONCTIONS API POUR LES LABELS ---

export async function fetchLabels(session: Session | null): Promise<Label[] | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for fetchLabels" };
  }
  return apiRequest<Label[]>('/labels', { method: 'GET' }, session);
}

export async function createLabel(session: Session | null, labelData: CreateLabelPayload): Promise<Label | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for createLabel" };
  }
  const payloadForBackend = {
    name: labelData.name,
    color: labelData.color === undefined ? null : labelData.color,
  };
  return apiRequest<Label>(
    '/labels',
    {
      method: 'POST',
      body: JSON.stringify(payloadForBackend),
    },
    session
  );
}

export async function updateLabel(session: Session | null, labelId: string, labelData: UpdateLabelData): Promise<Label | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for updateLabel" };
  }

  const payloadForBackend: BackendUpdateLabelPayload = {};
  if (labelData.name !== undefined) payloadForBackend.name = labelData.name;
  if (Object.prototype.hasOwnProperty.call(labelData, 'color')) {
      payloadForBackend.color = labelData.color;
  }

  return apiRequest<Label>(
    `/labels/${labelId}`,
    {
      method: 'PUT',
      body: JSON.stringify(payloadForBackend),
    },
    session
  );
}

export async function deleteLabel(session: Session | null, labelId: string): Promise<DeleteSuccessResponse | ApiError> {
  if (!session?.user?.id) {
    return { status: "error", statusCode: 401, message: "User not authenticated for deleteLabel" };
  }
  // La fonction apiRequest gère le 204 et le transforme en { status: "success", ... }
  return apiRequest<DeleteSuccessResponse>(
      `/labels/${labelId}`,
      { method: 'DELETE' },
      session
  );
}