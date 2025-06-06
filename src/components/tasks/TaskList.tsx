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

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Toggle } from '@/components/ui/toggle';
import { useDroppable } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    FilterIcon,
    FlagIcon,
    GridIcon,
    ListIcon,
    PlayCircleIcon,
    PlusIcon,
    RefreshCwIcon,
    TagIcon,
    UserIcon
} from 'lucide-react';
import { Timer } from '../timer/Timer';
import TaskCard from './TaskCard';

export const KANBAN_STATUSES = [
    {
        id: "todo",
        title: "To Do",
        color: "bg-task-todo border-task-todo",
        headerColor: "text-task-todo",
        icon: <FlagIcon className="h-4 w-4" />
    },
    {
        id: "inprogress",
        title: "In Progress",
        color: "bg-task-inprogress border-task-inprogress",
        headerColor: "text-task-inprogress",
        icon: <PlayCircleIcon className="h-4 w-4" />
    },
    {
        id: "done",
        title: "Done",
        color: "bg-task-done border-task-done",
        headerColor: "text-task-done",
        icon: <CheckCircleIcon className="h-4 w-4" />
    },
];

type ViewMode = 'kanban' | 'list';
type SortBy = 'created' | 'dueDate' | 'title';
type FilterBy = 'all' | 'overdue' | 'today' | 'week' | 'label';

interface TaskListProps {
    projectIdForFilter?: string | null;
    projectNameForFilter?: string | null;
    projectsForForms: Project[];
    allUserLabelsForForms: Label[];
    onTasksDataChanged: () => void;
    onLabelCreatedInTaskForm: (newLabel: Label) => void;
    areParentResourcesLoading: boolean;
    showTimer?: boolean;
    onPomodoroStateChange: (isActive: boolean) => void;
}

function DroppableColumn({
    id,
    title,
    color,
    headerColor,
    icon,
    tasks,
    children,
    isDragOver = false,
    viewMode = 'kanban'
}: {
    id: string;
    title: string;
    color: string;
    headerColor: string;
    icon: React.ReactNode;
    tasks: TaskWithLabels[];
    children: React.ReactNode;
    isDragOver?: boolean;
    viewMode?: ViewMode;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: {
            type: 'column',
            status: id
        }
    });

    const urgentCount = tasks.filter(task =>
        (task.due_date && new Date(task.due_date) < new Date())
    ).length;

    return (
        <Card
            ref={setNodeRef}
            className={`${color} p-4 flex flex-col transition-all duration-300 min-h-[400px] ${isOver || isDragOver
                ? 'ring-2 ring-primary shadow-xl scale-[1.02] bg-info-custom'
                : 'hover:shadow-md'
                } ${viewMode === 'list' ? 'md:min-h-[200px]' : ''}`}
        >
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-inherit py-2 z-10 rounded-md">
                <div className="flex items-center space-x-2">
                    <span className={headerColor}>{icon}</span>
                    <h3 className={`font-semibold ${headerColor}`}>
                        {title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                        {tasks.length}
                    </Badge>
                    {urgentCount > 0 && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                            {urgentCount} urgent
                        </Badge>
                    )}
                </div>
                {(isOver || isDragOver) && (
                    <Badge variant="outline" className="text-info-custom border-info-custom bg-background">
                        Drop here
                    </Badge>
                )}
            </div>
            <div className={`space-y-3 flex-1 ${viewMode === 'list' ? 'max-h-[300px] overflow-y-auto' : ''}`}>
                {children}
            </div>
        </Card>
    );
}

function TaskFilters({
    sortBy,
    setSortBy,
    filterBy,
    setFilterBy,
    selectedLabelId,
    setSelectedLabelId,
    viewMode,
    setViewMode,
    showFilters,
    setShowFilters,
    usedLabels
}: {
    sortBy: SortBy;
    setSortBy: (sort: SortBy) => void;
    filterBy: FilterBy;
    setFilterBy: (filter: FilterBy) => void;
    selectedLabelId: string | null;
    setSelectedLabelId: (labelId: string | null) => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    usedLabels: Array<Label & { taskCount: number }>;
}) {
    const handleFilterChange = (newFilter: FilterBy) => {
        setFilterBy(newFilter);
        if (newFilter !== 'label') {
            setSelectedLabelId(null);
        }
    };

    return (
        <div className="flex flex-col space-y-4">
            {/* Boutons de filtre rapide pour les labels les plus utilisés */}
            {usedLabels.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={filterBy === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFilterChange('all')}
                        className="h-8"
                    >
                        All ({usedLabels.reduce((sum, label) => sum + label.taskCount, 0)})
                    </Button>
                    {usedLabels.slice(0, 5).map((label) => (
                        <Button
                            key={label.id}
                            variant={filterBy === 'label' && selectedLabelId === label.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                                if (filterBy === 'label' && selectedLabelId === label.id) {
                                    handleFilterChange('all');
                                } else {
                                    setFilterBy('label');
                                    setSelectedLabelId(label.id);
                                }
                            }}
                            className="h-8"
                            style={{
                                backgroundColor: filterBy === 'label' && selectedLabelId === label.id
                                    ? label.color
                                    : undefined,
                                borderColor: label.color,
                                color: filterBy === 'label' && selectedLabelId === label.id
                                    ? '#ffffff'
                                    : label.color
                            }}
                        >
                            {label.name} ({label.taskCount})
                        </Button>
                    ))}
                </div>
            )}

            {/* Filtres existants */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-1"
                    >
                        <FilterIcon className="h-4 w-4" />
                        <span>Advanced Filters</span>
                    </Button>

                    {/* Toggle view mode */}
                    <div className="flex items-center border rounded-md">
                        <Toggle
                            pressed={viewMode === 'kanban'}
                            onPressedChange={() => setViewMode('kanban')}
                            size="sm"
                            className="rounded-r-none"
                        >
                            <GridIcon className="h-4 w-4" />
                        </Toggle>
                        <Toggle
                            pressed={viewMode === 'list'}
                            onPressedChange={() => setViewMode('list')}
                            size="sm"
                            className="rounded-l-none"
                        >
                            <ListIcon className="h-4 w-4" />
                        </Toggle>
                    </div>
                </div>
            </div>

            {showFilters && (
                <div className="flex flex-wrap gap-4 p-4 bg-filters rounded-lg border">
                    {/* Filtres existants */}
                    <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-filters" />
                        <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created">Created</SelectItem>
                                <SelectItem value="dueDate">Due Date</SelectItem>
                                <SelectItem value="title">Title</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-filters" />
                        <Select value={filterBy} onValueChange={handleFilterChange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tasks</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="today">Due Today</SelectItem>
                                <SelectItem value="week">Due This Week</SelectItem>
                                <SelectItem value="label">By Label</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sélecteur de label avancé */}
                    {filterBy === 'label' && (
                        <div className="flex items-center space-x-2">
                            <TagIcon className="h-4 w-4 text-filters" />
                            <Select
                                value={selectedLabelId || ''}
                                onValueChange={(value) => setSelectedLabelId(value || null)}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select a label..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {usedLabels.map((label) => (
                                        <SelectItem key={label.id} value={label.id}>
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: label.color }}
                                                />
                                                <span>{label.name}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {label.taskCount}
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            )}
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
    areParentResourcesLoading,
    showTimer = true,
    onPomodoroStateChange
}: TaskListProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [tasks, setTasks] = useState<TaskWithLabels[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTask, setEditingTask] = useState<TaskWithLabels | null>(null);
    const [activeTask, setActiveTask] = useState<TaskWithLabels | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
    const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, { originalTask: TaskWithLabels, timestamp: number }>>(new Map());
    const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

    // Nouveaux états pour les améliorations
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [sortBy, setSortBy] = useState<SortBy>('created');
    const [filterBy, setFilterBy] = useState<FilterBy>('all');
    const [showFilters, setShowFilters] = useState(false);

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

    // Fonction de filtrage et tri améliorée
    const getFilteredAndSortedTasks = useCallback((tasks: TaskWithLabels[]) => {
        let filtered = [...tasks];

        // Filtrage
        switch (filterBy) {
            case 'overdue':
                filtered = filtered.filter(task =>
                    task.due_date && new Date(task.due_date) < new Date()
                );
                break;
            case 'today':
                const today = new Date().toDateString();
                filtered = filtered.filter(task =>
                    task.due_date && new Date(task.due_date).toDateString() === today
                );
                break;
            case 'week':
                const weekFromNow = new Date();
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                filtered = filtered.filter(task =>
                    task.due_date && new Date(task.due_date) <= weekFromNow
                );
                break;
            case 'label':
                if (selectedLabelId) {
                    filtered = filtered.filter(task =>
                        task.labels?.some(label => label.id === selectedLabelId)
                    );
                }
                break;
        }

        // Tri
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'dueDate':
                    if (!a.due_date && !b.due_date) return 0;
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'created':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });

        return filtered;
    }, [filterBy, selectedLabelId, sortBy]);

    const getUsedLabels = useCallback((tasks: TaskWithLabels[]) => {
        const labelMap = new Map();

        tasks.forEach(task => {
            task.labels?.forEach(label => {
                if (!labelMap.has(label.id)) {
                    labelMap.set(label.id, {
                        ...label,
                        taskCount: 0
                    });
                }
                labelMap.get(label.id).taskCount++;
            });
        });

        return Array.from(labelMap.values())
            .sort((a, b) => b.taskCount - a.taskCount);
    }, []);

    const loadTasks = useCallback(async (force = false) => {
        if (sessionStatus !== "authenticated" || !session?.user?.id) {
            setIsLoading(false);
            setTasks([]);
            return;
        }

        const now = Date.now();
        if (!force && !isInitialLoadRef.current && (now - lastLoadTimeRef.current < 5000)) {
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

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isComponentMounted) {
                const timeSinceLastLoad = Date.now() - lastLoadTimeRef.current;
                if (timeSinceLastLoad > 120000) {
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

        let targetColumnId = null;

        if (over.data?.current?.type === 'column') {
            targetColumnId = over.data.current.status;
        } else if (over.data?.current?.type === 'task') {
            const overTask = tasks.find(t => t.id === over.id.toString());
            if (overTask) {
                targetColumnId = overTask.status;
            }
        }

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

        const originalTask = { ...activeTask };

        try {
            if (over.data?.current?.type === 'task') {
                const overTask = tasks.find(t => t.id === overId);
                if (!overTask) return;

                if (activeTask.status === overTask.status) {
                    const sameStatusTasks = tasks.filter(t => t.status === activeTask.status);
                    const oldIndex = sameStatusTasks.findIndex(t => t.id === activeId);
                    const newIndex = sameStatusTasks.findIndex(t => t.id === overId);

                    if (oldIndex !== newIndex) {
                        const reorderedTasks = arrayMove(sameStatusTasks, oldIndex, newIndex);

                        setTasks(prevTasks => {
                            const otherTasks = prevTasks.filter(t => t.status !== activeTask.status);
                            return [...otherTasks, ...reorderedTasks];
                        });

                        setOptimisticUpdates(prev => new Map(prev.set(activeId, {
                            originalTask,
                            timestamp: Date.now()
                        })));

                        const updateResult = await updateTask(session, activeId, {
                            order: newIndex
                        });

                        if (isApiError(updateResult)) {
                            throw new Error(updateResult.message);
                        }

                        setOptimisticUpdates(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(activeId);
                            return newMap;
                        });
                    }
                } else {
                    const newStatus = overTask.status;
                    const targetColumnTasks = tasks.filter(t => t.status === newStatus);

                    setTasks(prevTasks =>
                        prevTasks.map(task =>
                            task.id === activeId
                                ? { ...task, status: newStatus }
                                : task
                        )
                    );

                    setOptimisticUpdates(prev => new Map(prev.set(activeId, {
                        originalTask,
                        timestamp: Date.now()
                    })));

                    const updateResult = await updateTask(session, activeId, {
                        status: newStatus,
                        order: targetColumnTasks.length
                    });

                    if (isApiError(updateResult)) {
                        throw new Error(updateResult.message);
                    }

                    setOptimisticUpdates(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(activeId);
                        return newMap;
                    });
                }
            } else if (over.data?.current?.type === 'column') {
                const newStatus = over.data.current.status;
                if (newStatus !== activeTask.status) {
                    const targetColumnTasks = tasks.filter(t => t.status === newStatus);

                    setTasks(prevTasks =>
                        prevTasks.map(task =>
                            task.id === activeId
                                ? { ...task, status: newStatus }
                                : task
                        )
                    );

                    setOptimisticUpdates(prev => new Map(prev.set(activeId, {
                        originalTask,
                        timestamp: Date.now()
                    })));

                    const updateResult = await updateTask(session, activeId, {
                        status: newStatus,
                        order: targetColumnTasks.length
                    });

                    if (isApiError(updateResult)) {
                        throw new Error(updateResult.message);
                    }

                    setOptimisticUpdates(prev => {
                        const newMap = new Map(prev);
                        newMap.delete(activeId);
                        return newMap;
                    });
                }
            }

            onTasksDataChanged();

        } catch (error) {
            console.error('Error updating task:', error);
            setError('Failed to update task position');

            const optimisticUpdate = optimisticUpdates.get(activeId);
            if (optimisticUpdate) {
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === activeId ? optimisticUpdate.originalTask : task
                    )
                );

                setOptimisticUpdates(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(activeId);
                    return newMap;
                });
            }
        }
    };

    const filteredTasks = getFilteredAndSortedTasks(tasks);
    const groupedTasks = KANBAN_STATUSES.map(status => ({
        ...status,
        tasks: filteredTasks.filter(task => task.status === status.id)
    }));

    // Statistiques pour le header
    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'done').length,
        overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length,
    };

    const usedLabels = getUsedLabels(tasks);

    return (
        <div className="flex flex-col h-full space-y-6">
            {showTimer && (
                <Timer
                    tasks={tasks}
                    projectsForForms={projectsForForms}
                    onDataChanged={onTasksDataChanged}
                    onPomodoroStateChange={onPomodoroStateChange}
                />
            )}

            <div className="flex flex-col h-full">
                {/* Header amélioré avec statistiques */}
                <div className="flex flex-col space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">
                                {projectNameForFilter || "All Tasks"}
                            </h2>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-info-custom rounded-full"></span>
                                    <span>{taskStats.total} total</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                    <span className="w-2 h-2 bg-success-custom rounded-full"></span>
                                    <span>{taskStats.completed} completed</span>
                                </span>
                                {taskStats.overdue > 0 && (
                                    <span className="flex items-center space-x-1 text-warning-custom">
                                        <ClockIcon className="h-3 w-3" />
                                        <span>{taskStats.overdue} overdue</span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => loadTasks(true)}
                                disabled={isLoading}
                                title="Refresh tasks"
                            >
                                <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                                onClick={() => setShowAddForm(true)}
                                disabled={isLoading || areParentResourcesLoading}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Add Task
                            </Button>
                        </div>
                    </div>

                    {/* Filtres et vues */}
                    <TaskFilters
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        filterBy={filterBy}
                        setFilterBy={setFilterBy}
                        selectedLabelId={selectedLabelId}
                        setSelectedLabelId={setSelectedLabelId}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        usedLabels={usedLabels}
                    />
                </div>

                {optimisticUpdates.size > 0 && (
                    <Alert variant="default" className="mb-4 border-info-custom bg-info-custom">
                        <ClockIcon className="h-4 w-4 text-info-custom" />
                        <AlertDescription className="text-info-custom">
                            Syncing {optimisticUpdates.size} change{optimisticUpdates.size > 1 ? 's' : ''}...
                        </AlertDescription>
                    </Alert>
                )}

                {(isLoading || areParentResourcesLoading) && (
                    <div className={`grid gap-6 ${viewMode === 'kanban' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                        {KANBAN_STATUSES.map((status) => (
                            <div key={status.id} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{status.title}</h3>
                                    <Skeleton className="h-4 w-8" />
                                </div>
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="p-4 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                        <div className="flex space-x-2">
                                            <Skeleton className="h-2 w-8 rounded-full" />
                                            <Skeleton className="h-2 w-8 rounded-full" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {!session && sessionStatus === "unauthenticated" && (
                    <Alert variant="destructive">
                        <AlertDescription>Please sign in to manage tasks.</AlertDescription>
                    </Alert>
                )}

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                                setError(null);
                                loadTasks(true);
                            }}
                        >
                            Retry
                        </Button>
                    </Alert>
                )}

                {!isLoading && !areParentResourcesLoading && session && sessionStatus === "authenticated" && (
                    <>
                        {filteredTasks.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted py-12">
                                <svg className="w-16 h-16 mb-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                </svg>
                                <p className="text-lg font-medium mb-2">
                                    {tasks.length === 0 ? "No tasks found" : "No tasks match your filters"}
                                </p>
                                <p className="text-sm">
                                    {tasks.length === 0
                                        ? 'Click "Add Task" to create your first task.'
                                        : 'Try adjusting your filters or create a new task.'
                                    }
                                </p>
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
                                <div className={`gap-6 flex-1 ${viewMode === 'kanban'
                                    ? 'grid grid-cols-1 md:grid-cols-3'
                                    : 'flex flex-col space-y-4'
                                    }`}>
                                    {viewMode === 'kanban' ? (
                                        // Vue Kanban
                                        groupedTasks.map((column) => (
                                            <DroppableColumn
                                                key={column.id}
                                                id={column.id}
                                                title={column.title}
                                                color={column.color}
                                                headerColor={column.headerColor}
                                                icon={column.icon}
                                                tasks={column.tasks}
                                                isDragOver={dragOverColumn === column.id}
                                                viewMode={viewMode}
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
                                        ))
                                    ) : (
                                        // Vue Liste
                                        groupedTasks.map((column) => (
                                            column.tasks.length > 0 && (
                                                <DroppableColumn
                                                    key={column.id}
                                                    id={column.id}
                                                    title={column.title}
                                                    color={column.color}
                                                    headerColor={column.headerColor}
                                                    icon={column.icon}
                                                    tasks={column.tasks}
                                                    isDragOver={dragOverColumn === column.id}
                                                    viewMode={viewMode}
                                                >
                                                    <SortableContext
                                                        items={column.tasks.map(t => t.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                                                        </div>
                                                    </SortableContext>
                                                </DroppableColumn>
                                            )
                                        ))
                                    )}
                                </div>
                            </DndContext>
                        )}
                    </>
                )}
            </div>

            {showAddForm && (
                <AddTaskForm
                    onTaskCreated={handleTaskCreated}
                    onCancel={() => setShowAddForm(false)}
                    defaultProjectId={projectIdForFilter}
                    projects={projectsForForms}
                />
            )}

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

