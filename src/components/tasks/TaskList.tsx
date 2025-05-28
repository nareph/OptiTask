/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { isApiError } from "@/services/common";
import { Label } from "@/services/labelApi";
import { Project } from "@/services/projectApi";
import {
    deleteTask,
    fetchTasks, // Utilise ce type qui inclut les labels
    FetchTasksFilters,
    TaskWithLabels,
    updateTask,
} from "@/services/taskApi";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import LabelChip from "../labels/LabelChip"; // Assurez-vous que le chemin est correct
import AddTaskForm from "./AddTaskForm";
import EditTaskForm from "./EditTaskForm";

// Icônes (vous pouvez les remplacer par une bibliothèque d'icônes)
const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>;

interface TaskListProps {
    projectIdForFilter?: string | null;
    projectNameForFilter?: string | null; // Vous pourriez vouloir le récupérer depuis la liste des projets
    projectsForForms: Project[]; // Reçu du parent (DashboardPage)
    allUserLabelsForForms: Label[]; // Reçu du parent (DashboardPage)
    onLabelCreatedInTaskForm: (newLabel: Label) => void;
    onTasksDataChanged: () => void;
    areParentResourcesLoading: boolean; // Indique si projets/labels sont en chargement
}

export default function TaskList({
    projectIdForFilter,
    projectNameForFilter,
    projectsForForms,
    allUserLabelsForForms,
    onLabelCreatedInTaskForm,
    onTasksDataChanged,
    areParentResourcesLoading
}: TaskListProps) {
    const { data: session, status: sessionStatus } = useSession();

    const [tasks, setTasks] = useState<TaskWithLabels[]>([]);
    // projects et allUserLabels sont maintenant des props: projectsForForms, allUserLabelsForForms

    const [isLoadingTasks, setIsLoadingTasks] = useState(true); // État de chargement spécifique aux tâches
    const [error, setError] = useState<string | null>(null);

    const [showAddTaskForm, setShowAddTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskWithLabels | null>(null);

    const loadTasks = useCallback(async () => { // Renommé de loadInitialData
        if (sessionStatus !== "authenticated" || !session?.user?.id) {
            setIsLoadingTasks(false);
            setTasks([]);
            return;
        }

        setIsLoadingTasks(true); // Chargement des tâches
        setError(null);

        const filters: FetchTasksFilters = {};
        if (projectIdForFilter) {
            filters.project_id = projectIdForFilter;
        }

        try {
            const tasksResult = await fetchTasks(session, filters);
            if (isApiError(tasksResult)) { throw tasksResult; }
            setTasks(tasksResult);
        } catch (err) {
            if (isApiError(err)) { setError(err.message || "Failed to load tasks."); }
            else { setError("An unknown error occurred while loading tasks."); }
            setTasks([]);
        } finally {
            setIsLoadingTasks(false);
        }
    }, [session, sessionStatus, projectIdForFilter]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            loadTasks();
        } else if (sessionStatus === "unauthenticated") {
            setTasks([]);
            setIsLoadingTasks(false);
            setError(null);
        }
    }, [sessionStatus, loadTasks]); // Dépend de loadTasks

    const handleTaskCreated = (_newTask: TaskWithLabels) => {
        // Option 1: Re-fetcher tout (plus simple)
        // loadTasks();
        // Option 2: Ajouter localement (plus rapide, mais peut désynchroniser si des filtres sont actifs)
        // setTasks(prevTasks => [newTask, ...prevTasks].sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime() ));
        setShowAddTaskForm(false);
        onTasksDataChanged();
    };

    const handleTaskUpdated = (_updatedTask: TaskWithLabels) => {
        // Option 1: Re-fetcher tout
        //loadTasks();
        // Option 2: Mettre à jour localement
        // setTasks(prevTasks => 
        //   prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        //   .sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        // );
        setEditingTask(null);
        onTasksDataChanged();
    };

    const handleDeleteTask = async (taskId: string) => {
        if (sessionStatus !== "authenticated" || !session) {
            setError("Authentication required to delete.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        const result = await deleteTask(session, taskId);
        if (isApiError(result)) {
            setError(result.message || "Failed to delete task.");
        } else {
            //loadTasks(); // Re-fetch pour mettre à jour la liste
            onTasksDataChanged(); // Notifier le parent
            console.log(result.message);  // Ou une notification
        }
    };

    const handleStatusChange = async (task: TaskWithLabels, newStatus: string) => {
        if (sessionStatus !== "authenticated" || !session) {
            // Optionnel: afficher une erreur si l'utilisateur essaie d'agir sans session valide
            setError("Authentication required to change task status.");
            return;
        }

        const originalTask = { ...task }; // Sauvegarder l'état original complet de la tâche
        const optimisticTask = { ...task, status: newStatus, updated_at: new Date().toISOString() };

        // 1. Mise à jour optimiste de l'UI
        setTasks(prevTasks =>
            prevTasks.map(t => (t.id === task.id ? optimisticTask : t))
        );
        setError(null); // Effacer les erreurs précédentes

        // 2. Appel API
        const result = await updateTask(session, task.id, { status: newStatus });

        if (isApiError(result)) {
            setError(result.message || "Failed to update task status.");
            // 3a. Revert de la mise à jour optimiste en cas d'échec de l'API
            setTasks(prevTasks =>
                prevTasks.map(t => (t.id === task.id ? originalTask : t)) // Revenir à l'original
            );
            // Optionnel: Appeler onTasksDataChanged même en cas d'échec pour resynchroniser avec le serveur si besoin.
            // Cela dépend si vous voulez que l'UI reflète TOUJOURS le serveur, même si ça signifie un "flash"
            // si l'état du serveur est différent de originalTask.
            // onTasksDataChanged(); 
        } else {
            // 3b. Succès de l'API.
            // 'result' est la TaskWithLabels retournée par le backend.
            // Mettre à jour l'état local avec la donnée fraîche du serveur.
            setTasks(prevTasks =>
                prevTasks.map(t => (t.id === result.id ? result : t))
            );
            // Puisque l'API a réussi, on pourrait juste s'appuyer sur la donnée de `result`.
            // Cependant, si d'autres aspects de la tâche auraient pu changer côté serveur
            // entre-temps (peu probable pour un simple changement de statut),
            // appeler onTasksDataChanged() est plus sûr pour une synchronisation complète.
            // Si `updateTask` retourne déjà la tâche entièrement à jour avec tous ses champs (y compris labels),
            // onTasksDataChanged() n'est peut-être pas strictement nécessaire ici SI aucune autre tâche n'est affectée.
            // Mais pour la robustesse et si d'autres données pourraient avoir changé, c'est une bonne pratique.
            onTasksDataChanged(); // Notifier le parent pour un re-fetch global (ou au moins des tâches)
        }
    };
    // --- Gestion de l'affichage des formulaires en priorité ---
    if (editingTask) {
        return <EditTaskForm
            taskToEdit={editingTask}
            onTaskUpdated={handleTaskUpdated}
            onCancel={() => setEditingTask(null)}
            projects={projectsForForms} // Utilise la prop
            allUserLabels={allUserLabelsForForms} // Utilise la prop
            onLabelCreatedInForm={onLabelCreatedInTaskForm}
            areParentLabelsLoading={areParentResourcesLoading}
        />;
    }

    if (showAddTaskForm) {
        return <AddTaskForm
            onTaskCreated={handleTaskCreated}
            onCancel={() => setShowAddTaskForm(false)}
            defaultProjectId={projectIdForFilter}
            projects={projectsForForms} // Utilise la prop
        />;
    }

    // --- Affichage principal de la liste des tâches ---
    if (sessionStatus === "loading" || (isLoadingTasks && tasks.length === 0)) {
        return <p className="text-gray-500 animate-pulse text-center py-5">Loading tasks...</p>;
    }

    if (!session && sessionStatus === "unauthenticated") {
        return <p className="text-red-600 text-center py-5">Please sign in to manage tasks.</p>;
    }

    if (error) {
        return <p className="text-red-500 bg-red-50 p-3 rounded-md border border-red-200 text-sm">Error: {error}</p>;
    }

    return (
        <div className="mt-6 md:mt-0">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                    {projectNameForFilter ? `Tasks for: ${projectNameForFilter}` : (projectIdForFilter ? "Project Tasks" : "Your Tasks")}
                </h3>
                <button
                    onClick={() => { setShowAddTaskForm(true); setEditingTask(null); }}
                    disabled={isLoadingTasks}
                    className={`flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-500 disabled:bg-gray-400`}
                > <PlusIcon /> <span className="ml-1">Add Task</span> </button>
            </div>

            {!isLoadingTasks && tasks.length === 0 && (
                <p className="text-gray-500 py-4 text-center border-t border-b mt-4">
                    No tasks found for this view. Click &quot;+ Add Task&quot; to create one.
                </p>
            )}

            {tasks.length > 0 && (
                <ul className="space-y-3">
                    {tasks.map((task) => (
                        <li key={task.id} className="p-3.5 bg-white border rounded-lg shadow-sm hover:shadow-lg transition-shadow group">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow min-w-0">
                                    <div className="flex items-start space-x-2.5 mb-1.5">
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'done'}
                                            onChange={() => handleStatusChange(task, task.status === 'done' ? 'inprogress' : 'done')} // Cycle: done -> inprogress -> (potentiellement todo)
                                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer mt-1 disabled:opacity-50"
                                            aria-label={`Mark task ${task.title} as ${task.status === 'done' ? 'in progress' : 'done'}`}
                                            disabled={isLoadingTasks}
                                        />
                                        <span
                                            className={`font-medium text-base cursor-pointer hover:text-blue-600 ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}
                                            onClick={() => { if (!isLoadingTasks) { setEditingTask(task); setShowAddTaskForm(false); } }}
                                            title={`Edit task: ${task.title}`}
                                        >
                                            {task.title}
                                        </span>
                                    </div>
                                    {task.description && <p className="text-xs text-gray-600 ml-7 mb-2">{task.description}</p>}

                                    {task.labels && task.labels.length > 0 && (
                                        <div className="mt-1.5 ml-7 flex flex-wrap gap-1.5">
                                            {task.labels.map(label => (
                                                <LabelChip key={label.id} label={label} size="xs" />
                                            ))}
                                        </div>
                                    )}

                                    <div className="text-xs text-gray-400 mt-2 ml-7 space-x-3 flex flex-wrap gap-x-3 gap-y-1">
                                        {task.project_id && projectsForForms.find(p => p.id === task.project_id) &&
                                            <span>
                                                <span className="font-semibold">Project:</span> {projectsForForms.find(p => p.id === task.project_id)?.name || 'Unknown'}
                                            </span>
                                        }
                                        {task.due_date && <span><span className="font-semibold">Due:</span> {new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>}
                                        <span><span className="font-semibold">Status:</span> <span className="capitalize">{task.status}</span></span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0 ml-2 pt-1">
                                    <button
                                        title="Edit task"
                                        className="p-1.5 text-gray-500 hover:text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-50"
                                        onClick={() => { if (!isLoadingTasks) { setEditingTask(task); setShowAddTaskForm(false); } }}
                                        disabled={isLoadingTasks}
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        title="Delete task"
                                        className="p-1.5 text-gray-500 hover:text-red-700 rounded-md hover:bg-red-100 disabled:opacity-50"
                                        onClick={() => handleDeleteTask(task.id)}
                                        disabled={isLoadingTasks}
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}