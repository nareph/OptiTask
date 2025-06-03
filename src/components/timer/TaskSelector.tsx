// src/components/timer/TaskSelector.tsx
import { Project, TaskWithLabels } from '@/services/types';

interface TaskSelectorProps {
    tasks: TaskWithLabels[];
    projects: Project[]; // Liste des projets pour afficher les noms
    selectedTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
    disabled?: boolean;
}

export const TaskSelector = ({ tasks, projects, selectedTaskId, onSelectTask, disabled = false }: TaskSelectorProps) => {

    const getProjectNameForTask = (projectId: string | null | undefined): string => {
        if (!projectId) return '';
        const project = projects.find(p => p.id === projectId);
        return project ? `(${project.name})` : '(Unknown Project)';
    };

    // Optionnel: filtrer les tâches déjà terminées
    const availableTasks = tasks.filter(task => task.status !== 'done');

    return (
        <div className="space-y-1">
            <label htmlFor="task-selector" className="block text-sm font-medium text-gray-700">
                Track time for task:
            </label>
            <select
                id="task-selector"
                value={selectedTaskId || ''}
                onChange={(e) => onSelectTask(e.target.value === "" ? null : e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
                <option value="">-- Select a task --</option>
                {availableTasks.length > 0 ? (
                    availableTasks.map((task) => (
                        <option key={task.id} value={task.id}>
                            {task.title} {getProjectNameForTask(task.project_id)}
                        </option>
                    ))
                ) : (
                    <option value="" disabled>No available tasks to track</option>
                )}
            </select>
            {availableTasks.length === 0 && tasks.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">All tasks are marked as done.</p>
            )}
        </div>
    );
};