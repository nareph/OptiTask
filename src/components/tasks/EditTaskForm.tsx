// src/components/tasks/EditTaskForm.tsx
"use client";

import { isApiError } from "@/services/common";
import { Project } from "@/services/projectApi";
import { Task, updateTask, UpdateTaskData } from "@/services/taskApi"; // Mise à jour de l'import
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

interface EditTaskFormProps {
    taskToEdit: Task;
    onTaskUpdated: (updatedTask: Task) => void;
    onCancel: () => void;
    projects: Project[]; // Pour le <select> de projet
}

export default function EditTaskForm({ taskToEdit, onTaskUpdated, onCancel, projects }: EditTaskFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [title, setTitle] = useState(taskToEdit.title);
    const [description, setDescription] = useState(taskToEdit.description || "");
    const [projectId, setProjectId] = useState(taskToEdit.project_id || "");
    const [status, setStatus] = useState(taskToEdit.status);
    const [dueDate, setDueDate] = useState(taskToEdit.due_date || "");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || "");
        setProjectId(taskToEdit.project_id || "");
        setStatus(taskToEdit.status);
        setDueDate(taskToEdit.due_date || "");
    }, [taskToEdit]);

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

        const updateData: UpdateTaskData = {};
        let hasChanges = false;

        if (title.trim() !== taskToEdit.title) {
            updateData.title = title.trim();
            hasChanges = true;
        }
        const newDescription = description.trim() === "" ? null : description.trim();
        if (newDescription !== taskToEdit.description) {
            updateData.description = newDescription;
            hasChanges = true;
        }
        const newProjectId = projectId.trim() === "" ? null : projectId.trim();
        if (newProjectId !== taskToEdit.project_id) {
            updateData.project_id = newProjectId;
            hasChanges = true;
        }
        if (status !== taskToEdit.status) {
            updateData.status = status;
            hasChanges = true;
        }
        const newDueDate = dueDate.trim() === "" ? null : dueDate.trim();
        if (newDueDate !== taskToEdit.due_date) {
            updateData.due_date = newDueDate;
            hasChanges = true;
        }
        // Gérer 'order' si vous l'ajoutez au formulaire

        if (!hasChanges) {
            onCancel(); // Pas de changements, on ferme juste
            setIsSubmitting(false);
            return;
        }

        const result = await updateTask(session, taskToEdit.id, updateData);

        if (isApiError(result)) {
            setError(result.message || "Failed to update task.");
        } else {
            onTaskUpdated(result);
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="relative w-full max-w-lg space-y-4 p-6 bg-white rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">Edit Task</h3>
                <button type="button" onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                {error && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>}

                <div>
                    <label htmlFor="editTaskTitle" className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                    <input type="text" id="editTaskTitle" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="editTaskDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea id="editTaskDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="editTaskProjectId" className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select id="editTaskProjectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option value="">No Project</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="editTaskStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select id="editTaskStatus" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                        <option value="todo">To Do</option>
                        <option value="inprogress">In Progress</option>
                        <option value="done">Done</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="editTaskDueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input type="date" id="editTaskDueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>

                <div className="flex items-center space-x-3 pt-3 border-t mt-6">
                    <button type="submit" disabled={isSubmitting || sessionStatus !== "authenticated"}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button type="button" onClick={onCancel} disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}