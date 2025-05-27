// src/components/tasks/TaskList.tsx
"use client";

import { isApiError } from "@/services/common";
import { fetchProjects, Project } from "@/services/projectApi"; // Pour peupler le <select> dans les formulaires
import { deleteTask, fetchTasks, FetchTasksFilters, Task, updateTask } from "@/services/taskApi";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import AddTaskForm from "./AddTaskForm";
import EditTaskForm from "./EditTaskForm";

// Icônes
const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>;


interface TaskListProps {
    projectIdForFilter?: string | null; // Optionnel, pour afficher les tâches d'un projet spécifique
    // Si non fourni, on pourrait afficher toutes les tâches ou les tâches "sans projet".
}

export default function TaskList({ projectIdForFilter }: TaskListProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]); // Pour les formulaires
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const loadTasksAndProjects = useCallback(async () => {
        if (sessionStatus === "authenticated" && session?.user?.id) {
            setIsLoading(true);
            setError(null);
            const filters: FetchTasksFilters = {};
            if (projectIdForFilter) {
                filters.project_id = projectIdForFilter;
            }

            // Charger les tâches et les projets en parallèle
            const [tasksResult, projectsResult] = await Promise.all([
                fetchTasks(session, filters),
                fetchProjects(session) // On a besoin des projets pour les <select> des formulaires
            ]);

            if (isApiError(tasksResult)) {
                setError(tasksResult.message || "Failed to load tasks.");
                setTasks([]);
            } else {
                setTasks(tasksResult);
            }

            if (isApiError(projectsResult)) {
                // Gérer l'erreur de chargement des projets, peut-être un autre état d'erreur
                console.error("Failed to load projects for forms:", projectsResult.message);
                setProjects([]); // ou garder l'ancien état
            } else {
                setProjects(projectsResult);
            }

            setIsLoading(false);
        } else if (sessionStatus === "unauthenticated") {
            setIsLoading(false);
            setError("User not authenticated. Cannot fetch data.");
            setTasks([]);
            setProjects([]);
        }
    }, [session, sessionStatus, projectIdForFilter]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            loadTasksAndProjects();
        } else if (sessionStatus === "unauthenticated") {
            setTasks([]);
            setProjects([]);
            setIsLoading(false);
            setError(null);
        }
    }, [sessionStatus, loadTasksAndProjects]);

    const handleTaskCreated = () => {
        loadTasksAndProjects();
        setShowAddTaskForm(false);
    };

    const handleTaskUpdated = () => {
        loadTasksAndProjects();
        setEditingTask(null);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (sessionStatus !== "authenticated" || !session) { return; }
        if (!window.confirm("Are you sure you want to delete this task?")) return;

        const result = await deleteTask(session, taskId);
        if (isApiError(result)) {
            setError(result.message || "Failed to delete task.");
        } else {
            loadTasksAndProjects();
            console.log(result.message);
        }
    };

    if (sessionStatus === "loading") {
        return <p className="text-gray-500 animate-pulse text-center py-5">Loading tasks...</p>;
    }
    if (!session && sessionStatus === "unauthenticated") {
        return <p className="text-red-500 text-center py-5">Please sign in to manage tasks.</p>;
    }

    // Afficher les formulaires en mode modale (ou similaire) au-dessus de la liste si actifs
    if (editingTask) {
        return <EditTaskForm
            taskToEdit={editingTask}
            onTaskUpdated={handleTaskUpdated}
            onCancel={() => setEditingTask(null)}
            projects={projects}
        />;
    }
    if (showAddTaskForm) {
        return <AddTaskForm
            onTaskCreated={handleTaskCreated}
            onCancel={() => setShowAddTaskForm(false)}
            defaultProjectId={projectIdForFilter}
            projects={projects}
        />;
    }

    // Affichage de la liste si aucun formulaire n'est actif
    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                    {projectIdForFilter ? `Tasks for Project` /* TODO: Get project name */ : "All Your Tasks"}
                </h3>
                <button
                    onClick={() => { setShowAddTaskForm(true); setEditingTask(null); }}
                    className={`flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500`}
                >
                    <PlusIcon /> <span className="ml-1">Add Task</span>
                </button>
            </div>

            {isLoading && tasks.length === 0 && !error && (
                <p className="text-gray-500 animate-pulse text-center py-5">Loading tasks...</p>
            )}

            {error && (
                <p className="text-red-500 bg-red-50 p-3 rounded-md border border-red-200 text-sm">Error: {error}</p>
            )}

            {!isLoading && !error && tasks.length === 0 && (
                <p className="text-gray-500 py-4 text-center border-t border-b mt-4">
                    No tasks found for this view. Click &quot;+ Add Task&quot; to create one.
                </p>
            )}

            {tasks.length > 0 && (
                <ul className="space-y-3">
                    {tasks.map((task) => (
                        <li key={task.id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-lg transition-shadow flex justify-between items-start group">
                            <div className="flex-grow min-w-0">
                                <div className="flex items-center space-x-3 mb-1">
                                    <input
                                        type="checkbox"
                                        checked={task.status === 'done'}
                                        onChange={async () => {
                                            // TODO: Optimistic update ou loader pour le changement de statut
                                            if (session) {
                                                const newStatus = task.status === 'done' ? 'todo' : 'done';
                                                const result = await updateTask(session, task.id, { status: newStatus });
                                                if (!isApiError(result)) {
                                                    loadTasksAndProjects(); // Re-fetch pour voir le changement
                                                } else {
                                                    setError(result.message || "Failed to update task status");
                                                }
                                            }
                                        }}
                                        className="form-checkbox h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    />
                                    <span className={`font-semibold text-lg ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</span>
                                </div>
                                {task.description && <p className="text-sm text-gray-600 ml-8 mb-2">{task.description}</p>}
                                <div className="text-xs text-gray-500 ml-8 space-x-3">
                                    {task.project_id &&
                                        <span>
                                            Project: <span className="font-medium text-gray-700">{projects.find(p => p.id === task.project_id)?.name || 'Unknown'}</span>
                                        </span>
                                    }
                                    {task.due_date && <span>Due: <span className="font-medium text-gray-700">{new Date(task.due_date + 'T00:00:00').toLocaleDateString()}</span></span>}
                                    <span>Status: <span className="font-medium text-gray-700 capitalize">{task.status}</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0 ml-2">
                                <button title="Edit task" className="p-2 text-gray-500 hover:text-blue-700 rounded-md hover:bg-blue-100" onClick={() => { setEditingTask(task); setShowAddTaskForm(false); }}>
                                    <EditIcon />
                                </button>
                                <button title="Delete task" className="p-2 text-gray-500 hover:text-red-700 rounded-md hover:bg-red-100" onClick={() => handleDeleteTask(task.id)}>
                                    <DeleteIcon />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}