'use client';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isApiError } from "@/services/common";
import { createTask } from "@/services/taskApi";
import { CreateTaskPayload, Project, TaskWithLabels } from "@/services/types";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";

interface AddTaskFormProps {
    onTaskCreated: (newTask: TaskWithLabels) => void;
    onCancel?: () => void;
    defaultProjectId?: string | null;
    projects: Project[];
}

export default function AddTaskForm({
    onTaskCreated,
    onCancel,
    defaultProjectId,
    projects
}: AddTaskFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [projectId, setProjectId] = useState(defaultProjectId || "");
    const [status, setStatus] = useState("todo");
    const [dueDate, setDueDate] = useState<Date | undefined>();
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
            due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
        };

        const result = await createTask(session, taskData);

        if (isApiError(result)) {
            setError(result.message || "Failed to create task.");
        } else {
            onTaskCreated(result);
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
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div>
                    <label htmlFor="addTaskTitle" className="block text-sm font-medium mb-1">
                        Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="addTaskTitle"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor="addTaskDescription" className="block text-sm font-medium mb-1">
                        Description
                    </label>
                    <Textarea
                        id="addTaskDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="addTaskProjectId" className="block text-sm font-medium mb-1">
                            Project
                        </label>
                        <Select
                            value={projectId}
                            onValueChange={setProjectId}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="No Project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">No Project</SelectItem>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label htmlFor="addTaskStatus" className="block text-sm font-medium mb-1">
                            Status
                        </label>
                        <Select
                            value={status}
                            onValueChange={setStatus}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="inprogress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Due Date
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !dueDate && "text-muted-foreground"
                                    )}
                                    disabled={isSubmitting}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isSubmitting || sessionStatus !== "authenticated"}
                    >
                        {isSubmitting ? "Adding..." : "Add Task"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}