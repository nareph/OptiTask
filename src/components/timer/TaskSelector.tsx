// src/components/timer/TaskSelector.tsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, TaskWithLabels } from '@/services/types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface TaskSelectorProps {
    tasks: TaskWithLabels[];
    projects: Project[];
    selectedTaskId: string | null;
    onSelectTask: (taskId: string | null) => void;
    disabled?: boolean;
}

export const TaskSelector = ({
    tasks,
    projects,
    selectedTaskId,
    onSelectTask,
    disabled = false
}: TaskSelectorProps) => {

    const getProjectNameForTask = (projectId: string | null | undefined): Project | null => {
        if (!projectId) return null;
        return projects.find(p => p.id === projectId) || null;
    };

    // Filter out completed tasks
    const availableTasks = tasks.filter(task => task.status !== 'done');
    const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null;
    const selectedProject = selectedTask ? getProjectNameForTask(selectedTask.project_id) : null;

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                <Label htmlFor="task-selector" className="text-sm font-medium">
                    Track time for task
                </Label>
                <Select
                    value={selectedTaskId || ""}
                    onValueChange={(value) => onSelectTask(value === "" ? null : value)}
                    disabled={disabled}
                >
                    <SelectTrigger
                        id="task-selector"
                        className={disabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        <SelectValue placeholder="Select a task to track..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableTasks.length > 0 ? (
                            availableTasks.map((task) => {
                                const project = getProjectNameForTask(task.project_id);
                                return (
                                    <SelectItem key={task.id} value={task.id}>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="truncate">{task.title}</span>
                                            {project && (
                                                <Badge variant="secondary" className="ml-2 text-xs">
                                                    {project.name}
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                );
                            })
                        ) : (
                            <SelectItem value="No_tasks" disabled>
                                No available tasks to track
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>

            {/* Selected task info */}
            {selectedTask && (
                <Card className="bg-accent/50">
                    <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{selectedTask.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    {selectedProject && (
                                        <Badge variant="outline" className="text-xs">
                                            {selectedProject.name}
                                        </Badge>
                                    )}
                                    <Badge
                                        variant={selectedTask.status === 'in_progress' ? 'default' : 'secondary'}
                                        className="text-xs"
                                    >
                                        {selectedTask.status?.replace('_', ' ') || 'Unknown'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No tasks available warning */}
            {availableTasks.length === 0 && tasks.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                All tasks are marked as done. Create new tasks to track time.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* No tasks at all */}
            {tasks.length === 0 && (
                <Card className="border-dashed border-muted-foreground/25">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm text-muted-foreground">
                                No tasks available. Create some tasks first to track time.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};