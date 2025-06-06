'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Project, TaskWithLabels } from '@/services/types';
import { useSortable } from '@dnd-kit/sortable';
import { CalendarIcon, ClockIcon, GripVerticalIcon, SquarePenIcon, Trash2Icon } from 'lucide-react';

interface TaskCardProps {
    task: TaskWithLabels;
    projects: Project[];
    onEdit?: (task: TaskWithLabels) => void;
    onDelete?: (taskId: string) => void;
    isGloballyLoading?: boolean;
    isDragging?: boolean;
}

export default function TaskCard({
    task,
    projects,
    onEdit,
    onDelete,
    isGloballyLoading = false,
    isDragging = false
}: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging
    } = useSortable({
        id: task.id,
        data: {
            type: 'task',
            task: task
        }
    });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging || isSortableDragging ? 0.6 : 1,
        zIndex: isDragging || isSortableDragging ? 1000 : 'auto',
        cursor: isDragging || isSortableDragging ? 'grabbing' : 'default',
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isGloballyLoading && onEdit) {
            onEdit(task);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isGloballyLoading && onDelete) {
            onDelete(task.id);
        }
    };

    const getPriorityColor = () => {
        if (!task.due_date) return '';

        const dueDate = new Date(task.due_date);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'border-l-4 border-destructive';
        if (diffDays <= 1) return 'border-l-4 border-orange-500';
        if (diffDays <= 3) return 'border-l-4 border-warning';
        return 'border-l-4 border-success';
    };

    const formatDueDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
        if (diffDays <= 7) return `In ${diffDays} days`;

        return date.toLocaleDateString();
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`
                p-4 mb-3 group hover:shadow-md transition-all duration-200
                ${isDragging || isSortableDragging ? 'shadow-lg scale-105 ring-2 ring-primary' : ''}
                ${getPriorityColor()}
                ${isGloballyLoading ? 'opacity-50 pointer-events-none' : ''}
            `}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3 flex-grow min-w-0">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        {...attributes}
                        {...listeners}
                        disabled={isGloballyLoading}
                    >
                        <GripVerticalIcon className="h-4 w-4" />
                    </Button>

                    <div className="flex-grow min-w-0">
                        <h3
                            className={`font-medium text-sm leading-tight ${task.status === 'done'
                                ? 'line-through text-muted-foreground'
                                : 'text-foreground'
                                }`}
                        >
                            {task.title}
                        </h3>

                        {task.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-3 whitespace-pre-line">
                                {task.description}
                            </p>
                        )}

                        {task.labels?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {task.labels.map(label => (
                                    <Badge
                                        key={label.id}
                                        variant="outline"
                                        className="text-xs font-medium"
                                        style={{
                                            backgroundColor: `${label.color}20`,
                                            color: label.color,
                                            borderColor: `${label.color}30`
                                        }}
                                    >
                                        {label.name}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground mt-3 space-y-1">
                            {task.project_id && projects.find(p => p.id === task.project_id) && (
                                <div className="flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                    <span className="font-medium truncate">
                                        {projects.find(p => p.id === task.project_id)?.name}
                                    </span>
                                </div>
                            )}

                            {task.due_date && (
                                <div className="flex items-center">
                                    <CalendarIcon className="w-3 h-3 mr-1" />
                                    <span className={`font-medium ${new Date(task.due_date) < new Date() ? 'text-destructive' : ''}`}>
                                        {formatDueDate(task.due_date)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center text-muted-foreground">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onEdit && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleEditClick}
                                    disabled={isGloballyLoading}
                                >
                                    <SquarePenIcon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit task</TooltipContent>
                        </Tooltip>
                    )}
                    {onDelete && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:text-destructive"
                                    onClick={handleDeleteClick}
                                    disabled={isGloballyLoading}
                                >
                                    <Trash2Icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete task</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>
        </Card>
    );
}