// src/components/tasks/AddTaskForm.tsx
"use client";

import { isApiError } from "@/services/common";
import { createTask } from "@/services/taskApi";
import { CreateTaskPayload, Project, TaskWithLabels } from "@/services/types";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Modal } from "../ui/Modal";

interface AddTaskFormProps {
    onTaskCreated: (newTask: TaskWithLabels) => void;
    onCancel?: () => void;
    defaultProjectId?: string | null;
    projects: Project[]; // Requis pour le sélecteur de projet
}

export default function AddTaskForm({ onTaskCreated, onCancel, defaultProjectId, projects }: AddTaskFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [projectId, setProjectId] = useState(defaultProjectId || "");
    const [status, setStatus] = useState("todo");
    const [dueDate, setDueDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!title.trim()) { setError("Task title is required."); return; }
        if (sessionStatus !== "authenticated" || !session) { setError("User session not available."); return; }
        setIsSubmitting(true);

        const taskData: CreateTaskPayload = {
            title: title.trim(),
            description: description.trim() === "" ? undefined : description.trim(),
            project_id: projectId.trim() === "" ? undefined : projectId.trim(),
            status: status,
            due_date: dueDate.trim() === "" ? undefined : dueDate.trim(),
        };

        const result = await createTask(session, taskData);

        if (isApiError(result)) {
            setError(result.message || "Failed to create task.");
        } else {
            onTaskCreated(result);
            setTitle(""); setDescription(""); setProjectId(defaultProjectId || "");
            setStatus("todo"); setDueDate("");
            if (onCancel) onCancel();
        }
        setIsSubmitting(false);
    };

    return (
        <Modal
            isOpen={true}
            onClose={() => onCancel && onCancel()}
            title="Add New Task"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}

                <div>
                    <label htmlFor="addTaskTitle" className="block text-xs font-medium text-gray-600 mb-0.5">Title <span className="text-red-500">*</span></label>
                    <input type="text" id="addTaskTitle" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="addTaskDescription" className="block text-xs font-medium text-gray-600 mb-0.5">Description</label>
                    <textarea id="addTaskDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={isSubmitting}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label htmlFor="addTaskProjectId" className="block text-xs font-medium text-gray-600 mb-0.5">Project</label>
                        <select id="addTaskProjectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={isSubmitting}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="">No Project</option>
                            {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="addTaskStatus" className="block text-xs font-medium text-gray-600 mb-0.5">Status</label>
                        <select id="addTaskStatus" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSubmitting}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="todo">To Do</option> <option value="inprogress">In Progress</option> <option value="done">Done</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="addTaskDueDate" className="block text-xs font-medium text-gray-600 mb-0.5">Due Date</label>
                        <input type="date" id="addTaskDueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isSubmitting}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-2">
                    {onCancel && (
                        <button type="button" onClick={onCancel} disabled={isSubmitting}
                            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Cancel
                        </button>
                    )}
                    <button type="submit" disabled={isSubmitting || sessionStatus !== "authenticated"}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isSubmitting ? "Adding..." : "Add Task"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}