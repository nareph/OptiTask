"use client";

import { isApiError } from "@/services/common";
import { Project } from "@/services/projectApi"; // Importer le type Project si on passe une liste de projets
import { createTask, CreateTaskPayload, Task } from "@/services/taskApi"; // Mise à jour de l'import
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";

interface AddTaskFormProps {
    onTaskCreated: (newTask: Task) => void;
    onCancel?: () => void;
    defaultProjectId?: string | null;
    projects: Project[]; // Passer la liste des projets pour le <select>
}

export default function AddTaskForm({ onTaskCreated, onCancel, defaultProjectId, projects }: AddTaskFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    // Initialiser projectId avec defaultProjectId s'il est fourni, sinon chaîne vide
    const [projectId, setProjectId] = useState(defaultProjectId || "");
    const [status, setStatus] = useState("todo"); // Statut par défaut
    const [dueDate, setDueDate] = useState(""); // Format YYYY-MM-DD

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!title.trim()) {
            setError("Task title is required.");
            return;
        }
        if (sessionStatus !== "authenticated" || !session) {
            setError("User session not available.");
            return;
        }
        setIsSubmitting(true);

        const taskData: CreateTaskPayload = {
            title: title.trim(),
            description: description.trim() === "" ? undefined : description.trim(), // undefined pour que apiClient le transforme en null
            project_id: projectId.trim() === "" ? undefined : projectId.trim(), // undefined pour que apiClient le transforme en null
            status: status,
            due_date: dueDate.trim() === "" ? undefined : dueDate.trim(), // undefined pour que apiClient le transforme en null
            // order: sera géré par le backend ou dans une étape ultérieure
        };

        const result = await createTask(session, taskData);

        if (isApiError(result)) {
            setError(result.message || "Failed to create task.");
        } else {
            onTaskCreated(result);
            // Réinitialiser le formulaire
            setTitle("");
            setDescription("");
            setProjectId(defaultProjectId || "");
            setStatus("todo");
            setDueDate("");
            if (onCancel) onCancel(); // Fermer le formulaire si onCancel est fourni
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg shadow-sm mb-6 bg-white">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Add New Task</h3>
            {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

            <div>
                <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input type="text" id="taskTitle" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="taskDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="taskProjectId" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                    id="taskProjectId"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                    <option value="">No Project</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="taskStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select id="taskStatus" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                </select>
            </div>
            <div>
                <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input type="date" id="taskDueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>


            <div className="flex items-center space-x-3 pt-2">
                <button type="submit" disabled={isSubmitting || sessionStatus !== "authenticated"}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    {isSubmitting ? "Adding..." : "Add Task"}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}