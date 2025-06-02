// src/services/taskLabelApi.ts
import { Session } from "next-auth";
import { ApiError, apiRequest } from "./common";
import { DeleteSuccessResponse, Label } from "./types";


interface AddLabelToTaskResponse { // Ce que le backend retourne pour POST /tasks/{id}/labels
    status: "success";
    message: string;
    task_id: string;
    label_id: string;
}

export async function addLabelToTask(
    session: Session | null,
    taskId: string,
    labelId: string
): Promise<AddLabelToTaskResponse | ApiError> {
    if (!session?.user?.id) {
        return { status: "error", statusCode: 401, message: "User not authenticated for addLabelToTask" };
    }
    return apiRequest<AddLabelToTaskResponse>(
        `/tasks/${taskId}/labels`,
        {
            method: 'POST',
            body: JSON.stringify({ label_id: labelId }),
        },
        session
    );
}

export async function removeLabelFromTask(
    session: Session | null,
    taskId: string,
    labelId: string
): Promise<DeleteSuccessResponse | ApiError> {
    if (!session?.user?.id) {
        return { status: "error", statusCode: 401, message: "User not authenticated for removeLabelFromTask" };
    }
    return apiRequest<DeleteSuccessResponse>(
        `/tasks/${taskId}/labels/${labelId}`,
        { method: 'DELETE' },
        session
    );
}

export async function fetchLabelsForTask(
    session: Session | null,
    taskId: string
): Promise<Label[] | ApiError> { // Le backend retourne un tableau de Label
    if (!session?.user?.id) {
        return { status: "error", statusCode: 401, message: "User not authenticated for fetchLabelsForTask" };
    }
    return apiRequest<Label[]>(
        `/tasks/${taskId}/labels`,
        { method: 'GET' },
        session
    );
}