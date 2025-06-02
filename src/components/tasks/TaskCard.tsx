/* 'use client';
import { Project, TaskWithLabels } from '@/services/types';
import { useSortable } from '@dnd-kit/sortable';

// Icons
const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

interface TaskCardProps {
    task: TaskWithLabels;
    projects: Project[];
    onEdit?: (task: TaskWithLabels) => void;
    onDelete?: (taskId: string) => void;
    onStatusChange?: (task: TaskWithLabels, newStatus: string) => void;
    isGloballyLoading?: boolean;
}

export default function TaskCard({
    task,
    projects,
    onEdit,
    onDelete,
    isGloballyLoading = false
}: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 100 : 'auto',
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 relative group"
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3 flex-grow min-w-0">
                    <button
                        type="button"
                        {...listeners}
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1"
                        aria-label={`Drag task ${task.title}`}
                    >
                        <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <div className="flex-grow min-w-0">
                        <h3
                            className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}
                        >
                            {task.title}
                        </h3>

                        {task.description && (
                            <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                                {task.description}
                            </p>
                        )}

                        {task.labels?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {task.labels.map(label => (
                                    <span
                                        key={label.id}
                                        className="text-xs px-2 py-1 rounded-full"
                                        style={{
                                            backgroundColor: `${label.color}20`,
                                            color: label.color
                                        }}
                                    >
                                        {label.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-x-3 gap-y-1">
                            {task.project_id && projects.find(p => p.id === task.project_id) && (
                                <span className="flex items-center">
                                    <span className="font-medium mr-1">Project:</span>
                                    {projects.find(p => p.id === task.project_id)?.name}
                                </span>
                            )}
                            {task.due_date && (
                                <span className="flex items-center">
                                    <span className="font-medium mr-1">Due:</span>
                                    {new Date(task.due_date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                        <button
                            title="Edit task"
                            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                            onClick={handleEditClick}
                            disabled={isGloballyLoading}
                        >
                            <EditIcon />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            title="Delete task"
                            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                            onClick={handleDeleteClick}
                            disabled={isGloballyLoading}
                        >
                            <DeleteIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
} */


'use client';
import { Project, TaskWithLabels } from '@/services/types';
import { useSortable } from '@dnd-kit/sortable';

// Icons
const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
    </svg>
);

const DeleteIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

const DragIcon = () => (
    <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8h16M4 16h16"></path>
    </svg>
);

interface TaskCardProps {
    task: TaskWithLabels;
    projects: Project[];
    onEdit?: (task: TaskWithLabels) => void;
    onDelete?: (taskId: string) => void;
    onStatusChange?: (task: TaskWithLabels, newStatus: string) => void;
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

    // Fonction pour obtenir la couleur de priorité basée sur la date d'échéance
    const getPriorityColor = () => {
        if (!task.due_date) return '';

        const dueDate = new Date(task.due_date);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'border-l-4 border-red-500'; // En retard
        if (diffDays <= 1) return 'border-l-4 border-orange-500'; // Urgent
        if (diffDays <= 3) return 'border-l-4 border-yellow-500'; // Bientôt
        return 'border-l-4 border-green-500'; // Normal
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
        <div
            ref={setNodeRef}
            style={style}
            className={`
                bg-white p-4 rounded-lg shadow-sm border border-gray-200 
                group hover:shadow-md transition-all duration-200
                ${isDragging || isSortableDragging ? 'shadow-lg scale-105 rotate-1' : ''}
                ${getPriorityColor()}
                ${isGloballyLoading ? 'opacity-50 pointer-events-none' : ''}
            `}
        >
            <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3 flex-grow min-w-0">
                    {/* Drag Handle */}
                    <button
                        type="button"
                        {...listeners}
                        {...attributes}
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        aria-label={`Drag task ${task.title}`}
                        disabled={isGloballyLoading}
                    >
                        <DragIcon />
                    </button>

                    <div className="flex-grow min-w-0">
                        {/* Titre de la tâche */}
                        <h3
                            className={`font-medium text-sm leading-tight ${task.status === 'done'
                                ? 'line-through text-gray-400'
                                : 'text-gray-800'
                                }`}
                        >
                            {task.title}
                        </h3>

                        {/* Description */}
                        {task.description && (
                            <p className="text-xs text-gray-500 mt-2 line-clamp-3 whitespace-pre-line">
                                {task.description}
                            </p>
                        )}

                        {/* Labels */}
                        {task.labels?.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                                {task.labels.map(label => (
                                    <span
                                        key={label.id}
                                        className="text-xs px-2 py-1 rounded-full font-medium"
                                        style={{
                                            backgroundColor: `${label.color}20`,
                                            color: label.color,
                                            border: `1px solid ${label.color}30`
                                        }}
                                    >
                                        {label.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Métadonnées */}
                        <div className="text-xs text-gray-500 mt-3 space-y-1">
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
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <span className={`font-medium ${new Date(task.due_date) < new Date() ? 'text-red-600' : ''
                                        }`}>
                                        {formatDueDate(task.due_date)}
                                    </span>
                                </div>
                            )}

                            {/* Date de création */}
                            <div className="flex items-center text-gray-400">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {onEdit && (
                        <button
                            title="Edit task"
                            className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                            onClick={handleEditClick}
                            disabled={isGloballyLoading}
                        >
                            <EditIcon />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            title="Delete task"
                            className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                            onClick={handleDeleteClick}
                            disabled={isGloballyLoading}
                        >
                            <DeleteIcon />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}