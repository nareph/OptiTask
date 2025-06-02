'use client';
import { isApiError } from '@/services/common';
import { deleteTask, fetchTasks, updateTask } from '@/services/taskApi';
import { Label, Project, TaskWithLabels } from '@/services/types';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AddTaskForm from './AddTaskForm';
import EditTaskForm from './EditTaskForm';

import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';

import { useDroppable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { RefreshIcon } from '../ui/Icons';
import TaskCard from './TaskCard';

// Icons
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>;

export const KANBAN_STATUSES = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "done", title: "Done" },
];

interface TaskListProps {
    projectIdForFilter?: string | null;
    projectNameForFilter?: string | null;
    projectsForForms: Project[];
    allUserLabelsForForms: Label[];
    onTasksDataChanged: () => void;
    onLabelCreatedInTaskForm: (newLabel: Label) => void;
    areParentResourcesLoading: boolean;
}

// Composant DroppableColumn pour gérer les zones de drop
function DroppableColumn({
    id,
    title,
    tasks,
    children,
    isDragOver = false
}: {
    id: string;
    title: string;
    tasks: TaskWithLabels[];
    children: React.ReactNode;
    isDragOver?: boolean;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: 'column',
            status: id
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`bg-gray-50 rounded-lg p-4 flex flex-col transition-all duration-200 ${isOver || isDragOver
                ? 'bg-blue-50 ring-2 ring-blue-300 shadow-lg scale-[1.02]'
                : ''
                }`}
        >
            <h3 className="font-semibold text-gray-700 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                {title} <span className="text-gray-500">({tasks.length})</span>
                {(isOver || isDragOver) && (
                    <span className="ml-2 text-blue-600 text-sm">← Drop here</span>
                )}
            </h3>
            <div className="space-y-3 flex-1 min-h-[100px]">
                {children}
            </div>
        </div>
    );
}

export default function TaskList({
    projectIdForFilter,
    projectNameForFilter,
    projectsForForms,
    allUserLabelsForForms,
    onTasksDataChanged,
    onLabelCreatedInTaskForm,
    areParentResourcesLoading
}: TaskListProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [tasks, setTasks] = useState<TaskWithLabels[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskWithLabels | null>(null);
    const [activeTask, setActiveTask] = useState<TaskWithLabels | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // État pour gérer les mises à jour optimistes
    const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, { originalTask: TaskWithLabels, timestamp: number }>>(new Map());

    // Refs pour éviter les rechargements inutiles
    const lastLoadTimeRef = useRef<number>(0);
    const isInitialLoadRef = useRef(true);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
                delay: 100,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const loadTasks = useCallback(async (force = false) => {
        if (sessionStatus !== "authenticated" || !session?.user?.id) {
            setIsLoading(false);
            setTasks([]);
            return;
        }

        // Éviter les rechargements trop fréquents (sauf si forcé)
        const now = Date.now();
        if (!force && !isInitialLoadRef.current && (now - lastLoadTimeRef.current < 5000)) {
            console.log('TaskList: Skipping reload - too recent');
            return;
        }

        setIsLoading(true);
        setError(null);
        lastLoadTimeRef.current = now;

        try {
            const result = await fetchTasks(session, {
                project_id: projectIdForFilter || undefined
            });

            if (isApiError(result)) {
                throw new Error(result.message);
            }

            setTasks(result);
            isInitialLoadRef.current = false;

            // Nettoyer les mises à jour optimistes anciennes (plus de 30 secondes)
            setOptimisticUpdates(prev => {
                const now = Date.now();
                const newMap = new Map();
                prev.forEach((value, key) => {
                    if (now - value.timestamp < 30000) {
                        newMap.set(key, value);
                    }
                });
                return newMap;
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tasks");
        } finally {
            setIsLoading(false);
        }
    }, [session, sessionStatus, projectIdForFilter]);

    useEffect(() => {
        let isComponentMounted = true;

        const load = async () => {
            if (sessionStatus === "authenticated" && isComponentMounted) {
                await loadTasks(true);
            }
        };

        // Gestionnaire d'événement pour la visibilité - PLUS RESTRICTIF
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isComponentMounted) {
                // Ne recharger que si l'onglet a été inactif pendant plus de 2 minutes
                const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
                if (timeSinceLastLoad > 120000) {
                    console.log('TaskList: Reloading after visibility change (2min+ inactive)');
                    loadTasks(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        load();

        return () => {
            isComponentMounted = false;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [sessionStatus, projectIdForFilter, loadTasks]);

    const handleTaskCreated = () => {
        setShowAddForm(false);
        loadTasks(true);
        onTasksDataChanged();
    };

    const handleTaskUpdated = () => {
        setEditingTask(null);
        loadTasks(true);
        onTasksDataChanged();
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!session || !window.confirm("Are you sure you want to delete this task?")) return;

        try {
            const result = await deleteTask(session, taskId);
            if (isApiError(result)) {
                throw new Error(result.message);
            }

            // Mise à jour optimiste - supprimer de l'état local
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
            onTasksDataChanged();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete task");
            loadTasks(true);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const activeTaskData = tasks.find(t => t.id === event.active.id);
        setActiveTask(activeTaskData || null);
        setDragOverColumn(null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over || !active) {
            setDragOverColumn(null);
            return;
        }

        const activeId = active.id.toString();
        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Déterminer sur quelle colonne on survole
        let targetColumnId = null;

        if (over.data?.current?.type === 'column') {
            targetColumnId = over.data.current.status;
        } else if (over.data?.current?.type === 'task') {
            const overTask = tasks.find(t => t.id === over.id.toString());
            if (overTask) {
                targetColumnId = overTask.status;
            }
        }

        // Mettre à jour l'indicateur visuel seulement si c'est une colonne différente
        if (targetColumnId && targetColumnId !== activeTask.status) {
            setDragOverColumn(targetColumnId);
        } else {
            setDragOverColumn(null);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setDragOverColumn(null);

        if (!over || !session) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        const activeTask = tasks.find(t => t.id === activeId);
        if (!activeTask) return;

        // Sauvegarder l'état original pour un éventuel rollback
        const originalTask = { ...activeTask };

        try {
            // Si on dépose sur une autre tâche
            if (over.data?.current?.type === 'task') {
                const overTask = tasks.find(t => t.id === overId);
                if (!overTask) return;

                // Même colonne - réorganisation
                if (activeTask.status === overTask.status) {
                    const sameStatusTasks = tasks.filter(t => t.status === activeTask.status);
                    const oldIndex = sameStatusTasks.findIndex(t => t.id === activeId);
                    const newIndex = sameStatusTasks.findIndex(t => t.id === overId);

                    if (oldIndex !== newIndex) {
                        const reorderedTasks = arrayMove(sameStatusTasks, oldIndex, newIndex);

                        // Mise à jour optimiste immédiate
                        setTasks(prevTasks => {
                            const otherTasks = prevTasks.filter(t => t.status !== activeTask.status);
                            return [...otherTasks, ...reorderedTasks];
                        });

                        // Sauvegarder pour rollback éventuel
                        setOptimisticUpdates(prev => new Map(prev.set(activeId, {
                            originalTask,
                            timestamp: Date.now()
                        })));

                        // Mise à jour en arrière-plan
                        const updateResult = await updateTask(session, activeId, {
                            order: newIndex
                        });

                        if (isApiError(updateResult)) {
                            throw new Error(updateResult.message);
                        }

                        // Supprimer de la liste des mises à jour optimistes
                        setOptimisticUpdates(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(activeId);
                            return newMap;
                        });
                    }
                }
                // Colonne différente - changement de statut
                else {
                    const newStatus = overTask.status;
                    const targetColumnTasks = tasks.filter(t => t.status === newStatus);

                    // Mise à jour optimiste immédiate
                    setTasks(prevTasks =>
                        prevTasks.map(task =>
                            task.id === activeId
                                ? { ...task, status: newStatus }
                                : task
                        )
                    );

                    // Sauvegarder pour rollback éventuel
                    setOptimisticUpdates(prev => new Map(prev.set(activeId, {
                        originalTask,
                        timestamp: Date.now()
                    })));

                    // Mise à jour en arrière-plan
                    const updateResult = await updateTask(session, activeId, {
                        status: newStatus,
                        order: targetColumnTasks.length
                    });

                    if (isApiError(updateResult)) {
                        throw new Error(updateResult.message);
                    }

                    // Supprimer de la liste des mises à jour optimistes
                    setOptimisticUpdates(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(activeId);
                        return newMap;
                    });
                }
            }
            // Si on dépose sur une colonne
            else if (over.data?.current?.type === 'column') {
                const newStatus = over.data.current.status;
                if (newStatus !== activeTask.status) {
                    const targetColumnTasks = tasks.filter(t => t.status === newStatus);

                    // Mise à jour optimiste immédiate
                    setTasks(prevTasks =>
                        prevTasks.map(task =>
                            task.id === activeId
                                ? { ...task, status: newStatus }
                                : task
                        )
                    );

                    // Sauvegarder pour rollback éventuel
                    setOptimisticUpdates(prev => new Map(prev.set(activeId, {
                        originalTask,
                        timestamp: Date.now()
                    })));

                    // Mise à jour en arrière-plan
                    const updateResult = await updateTask(session, activeId, {
                        status: newStatus,
                        order: targetColumnTasks.length
                    });

                    if (isApiError(updateResult)) {
                        throw new Error(updateResult.message);
                    }

                    // Supprimer de la liste des mises à jour optimistes
                    setOptimisticUpdates(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(activeId);
                        return newMap;
                    });
                }
            }

            // Notifier les changements SANS recharger
            onTasksDataChanged();

        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task position');

            // Rollback en cas d'erreur
            const optimisticUpdate = optimisticUpdates.get(activeId);
            if (optimisticUpdate) {
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === activeId ? optimisticUpdate.originalTask : task
                    )
                );

                // Supprimer de la liste des mises à jour optimistes
                setOptimisticUpdates(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(activeId);
                    return newMap;
                });
            }
        }
    };

    const groupedTasks = KANBAN_STATUSES.map(status => ({
        ...status,
        tasks: tasks.filter(task => task.status === status.id)
    }));

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                    {projectNameForFilter || "All Tasks"}
                </h2>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => loadTasks(true)}
                        disabled={isLoading}
                        className="p-2 text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
                        title="Refresh tasks"
                    >
                        <RefreshIcon />
                    </button>
                    <button
                        onClick={() => setShowAddForm(true)}
                        disabled={isLoading || areParentResourcesLoading}
                        className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200"
                    >
                        <PlusIcon />
                        <span className="ml-2">Add Task</span>
                    </button>
                </div>
            </div>

            {/* Indicateur de mises à jour en cours - TOUJOURS visible si nécessaire */}
            {optimisticUpdates.size > 0 && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-700">
                        Syncing {optimisticUpdates.size} change{optimisticUpdates.size > 1 ? 's' : ''}...
                    </p>
                </div>
            )}

            {/* Contenu principal - États de chargement/erreur SANS masquer le layout */}
            {(isLoading || areParentResourcesLoading) && (
                <div className="flex justify-center items-center p-8 min-h-[400px]">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500">Loading tasks...</p>
                    </div>
                </div>
            )}

            {!session && sessionStatus === "unauthenticated" && (
                <div className="text-red-600 text-center py-8 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-lg font-medium">Please sign in to manage tasks.</p>
                </div>
            )}

            {error && (
                <div className="text-red-500 bg-red-50 p-4 rounded-md border border-red-200 mb-4">
                    <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => {
                                setError(null);
                                loadTasks(true);
                            }}
                            className="ml-4 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Dashboard Kanban - TOUJOURS visible quand les tâches sont chargées */}
            {!isLoading && !areParentResourcesLoading && session && sessionStatus === "authenticated" && (
                <>
                    {tasks.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 py-12">
                            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <p className="text-lg font-medium mb-2">No tasks found</p>
                            <p className="text-sm">Click &quot;Add Task&quot; to create your first task.</p>
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCorners}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToWindowEdges]}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                                {groupedTasks.map((column) => (
                                    <DroppableColumn
                                        key={column.id}
                                        id={column.id}
                                        title={column.title}
                                        tasks={column.tasks}
                                        isDragOver={dragOverColumn === column.id}
                                    >
                                        <SortableContext
                                            items={column.tasks.map(t => t.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {column.tasks.map((task) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    projects={projectsForForms}
                                                    onEdit={setEditingTask}
                                                    onDelete={handleDeleteTask}
                                                    isGloballyLoading={isLoading || areParentResourcesLoading}
                                                    isDragging={activeTask?.id === task.id}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DroppableColumn>
                                ))}
                            </div>
                        </DndContext>
                    )}
                </>
            )}
            {/* Add Task Modal */}

            {showAddForm && (<AddTaskForm
                onTaskCreated={handleTaskCreated}
                onCancel={() => setShowAddForm(false)}
                defaultProjectId={projectIdForFilter}
                projects={projectsForForms}
            />
            )}

            {/* Edit Task Modal */}

            {editingTask && (
                <EditTaskForm
                    taskToEdit={editingTask}
                    onTaskUpdated={handleTaskUpdated}
                    onCancel={() => setEditingTask(null)}
                    projects={projectsForForms}
                    allUserLabels={allUserLabelsForForms}
                    onLabelCreatedInForm={onLabelCreatedInTaskForm}
                    areParentLabelsLoading={areParentResourcesLoading || isLoading}
                />
            )}
        </div>
    );
}