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
import { apiRequest, isApiError } from "@/services/common";
import { createLabel } from "@/services/labelApi";
import { updateTask } from "@/services/taskApi";
import { addLabelToTask, removeLabelFromTask } from "@/services/taskLabelApi";
import { CreateLabelPayload, Label, Project, TaskWithLabels, UpdateTaskData } from "@/services/types";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { GroupBase, MultiValue, StylesConfig } from 'react-select';
import makeAnimated from 'react-select/animated';
import CreatableSelect from 'react-select/creatable';

interface EditTaskFormProps {
    taskToEdit: TaskWithLabels;
    onTaskUpdated: (updatedTask: TaskWithLabels) => void;
    onCancel: () => void;
    projects: Project[];
    allUserLabels: Label[];
    onLabelCreatedInForm: (newLabel: Label) => void;
    areParentLabelsLoading?: boolean;
}

interface LabelOption {
    readonly value: string;
    readonly label: string;
    readonly color?: string | null;
    readonly __isNew__?: boolean;
}

const animatedComponents = makeAnimated();

function isColorDark(hexColor: string | null | undefined): boolean {
    if (!hexColor) return false;
    let color = hexColor.charAt(0) === '#' ? hexColor.substring(1, 7) : hexColor;
    if (color.length === 3) color = color.split('').map(char => char + char).join('');
    if (color.length !== 6) return false;
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 128;
}

const colorStyles: StylesConfig<LabelOption, true, GroupBase<LabelOption>> = {
    option: (styles, { data }) => ({
        ...styles, display: 'flex', alignItems: 'center', fontSize: '0.875rem', cursor: 'pointer',
        ':before': { backgroundColor: data.color || '#E5E7EB', borderRadius: '50%', content: '" "', display: 'block', marginRight: 8, height: 10, width: 10, border: '1px solid #D1D5DB' },
    }),
    multiValue: (styles, { data }) => ({
        ...styles, backgroundColor: data.color ? `${data.color}CC` : '#E5E7EB', color: data.color ? (isColorDark(data.color) ? 'white' : '#1F2937') : '#1F2937',
        borderRadius: '4px', fontSize: '0.75rem', alignItems: 'center', margin: '2px',
    }),
    multiValueLabel: (styles, { data }) => ({
        ...styles, color: data.color ? (isColorDark(data.color) ? 'white' : '#1F2937') : '#1F2937', paddingLeft: '6px', paddingRight: '2px',
        display: 'flex', alignItems: 'center',
        ':before': { backgroundColor: data.color || '#9CA3AF', borderRadius: '50%', content: '" "', display: 'inline-block', marginRight: 5, height: 8, width: 8 },
    }),
    multiValueRemove: (styles, { data }) => ({
        ...styles, color: data.color ? (isColorDark(data.color) ? '#F3F4F6' : '#4B5563') : '#4B5563',
        borderTopRightRadius: '4px', borderBottomRightRadius: '4px', paddingLeft: '2px', paddingRight: '2px', cursor: 'pointer',
        ':hover': { backgroundColor: data.color ? `${data.color}E6` : '#D1D5DB', color: data.color ? (isColorDark(data.color) ? 'white' : '#111827') : '#111827' },
    }),
    placeholder: (styles) => ({ ...styles, fontSize: '0.875rem', color: '#6B7280' }),
    input: (styles) => ({ ...styles, fontSize: '0.875rem', margin: '0px' }),
    control: (styles) => ({ ...styles, fontSize: '0.875rem', minHeight: '36px' }),
};

export default function EditTaskForm({
    taskToEdit,
    onTaskUpdated,
    onCancel,
    projects,
    allUserLabels,
    onLabelCreatedInForm,
    areParentLabelsLoading = false
}: EditTaskFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [title, setTitle] = useState(taskToEdit.title);
    const [description, setDescription] = useState(taskToEdit.description || "");
    const [projectId, setProjectId] = useState(taskToEdit.project_id || "");
    const [status, setStatus] = useState(taskToEdit.status);
    const [dueDate, setDueDate] = useState<Date | undefined>(
        taskToEdit.due_date ? new Date(taskToEdit.due_date) : undefined
    );
    const [selectedLabelOptions, setSelectedLabelOptions] = useState<MultiValue<LabelOption>>(() =>
        taskToEdit.labels.map(l => ({ value: l.id, label: l.name, color: l.color }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || "");
        setProjectId(taskToEdit.project_id || "");
        setStatus(taskToEdit.status);
        setDueDate(taskToEdit.due_date ? new Date(taskToEdit.due_date) : undefined);
        setSelectedLabelOptions(taskToEdit.labels.map(l => ({ value: l.id, label: l.name, color: l.color })));
    }, [taskToEdit]);

    const userLabelOptions: LabelOption[] = allUserLabels.map(l => ({
        value: l.id,
        label: l.name,
        color: l.color,
    }));

    const handleCreateLabel = async (inputValue: string) => {
        if (!session || !inputValue.trim()) return;
        setError(null);
        setIsCreatingLabel(true);

        const newLabelData: CreateLabelPayload = { name: inputValue.trim(), color: null };
        const result = await createLabel(session, newLabelData);

        setIsCreatingLabel(false);
        if (!isApiError(result)) {
            onLabelCreatedInForm(result);
            const newOption: LabelOption = { value: result.id, label: result.name, color: result.color };
            setSelectedLabelOptions(prev => [...prev, newOption]);
        } else {
            setError(result.message || "Failed to create new label.");
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!title.trim()) { setError("Task title is required."); return; }
        if (sessionStatus !== "authenticated" || !session) { setError("User session not available."); return; }

        setIsSubmitting(true);

        const updateTaskData: UpdateTaskData = {};
        let taskDetailsActuallyChanged = false;

        if (title.trim() !== taskToEdit.title) { updateTaskData.title = title.trim(); taskDetailsActuallyChanged = true; }
        const newDescriptionTrimmed = description.trim();
        const newDescriptionVal = newDescriptionTrimmed === "" ? null : newDescriptionTrimmed;
        if (newDescriptionVal !== (taskToEdit.description || null)) { updateTaskData.description = newDescriptionVal; taskDetailsActuallyChanged = true; }
        const newProjectIdVal = projectId.trim() === "" ? null : projectId.trim();
        if (newProjectIdVal !== taskToEdit.project_id) { updateTaskData.project_id = newProjectIdVal; taskDetailsActuallyChanged = true; }
        if (status !== taskToEdit.status) { updateTaskData.status = status; taskDetailsActuallyChanged = true; }
        const newDueDateVal = dueDate ? null : dueDate;
        if (newDueDateVal !== taskToEdit.due_date) { updateTaskData.due_date = newDueDateVal; taskDetailsActuallyChanged = true; }

        let currentTaskStateFromApi = { ...taskToEdit };

        if (taskDetailsActuallyChanged) {
            const taskUpdateResult = await updateTask(session, taskToEdit.id, updateTaskData);
            if (isApiError(taskUpdateResult)) {
                setError(taskUpdateResult.message || "Failed to update task details.");
                setIsSubmitting(false); return;
            }
            currentTaskStateFromApi = taskUpdateResult;
        }

        const initialLabelIdsOnTask = new Set(taskToEdit.labels.map(l => l.id));
        const currentSelectedLabelIdsInForm = new Set(selectedLabelOptions.map(opt => opt.value));
        const labelsToAdd = Array.from(currentSelectedLabelIdsInForm).filter(id => !initialLabelIdsOnTask.has(id));
        const labelsToRemove = Array.from(initialLabelIdsOnTask).filter(id => !currentSelectedLabelIdsInForm.has(id));

        let labelOperationsErrorOccurred = false;
        let labelErrorMsg = "";
        if (labelsToAdd.length > 0 || labelsToRemove.length > 0) {
            for (const labelId of labelsToAdd) {
                const addResult = await addLabelToTask(session, taskToEdit.id, labelId);
                if (isApiError(addResult)) { labelErrorMsg = addResult.message || `Error adding label ${labelId}`; labelOperationsErrorOccurred = true; break; }
            }
            if (!labelOperationsErrorOccurred) {
                for (const labelId of labelsToRemove) {
                    const removeResult = await removeLabelFromTask(session, taskToEdit.id, labelId);
                    if (isApiError(removeResult)) { labelErrorMsg = removeResult.message || `Error removing label ${labelId}`; labelOperationsErrorOccurred = true; break; }
                }
            }
        }
        if (labelErrorMsg) setError(labelErrorMsg);


        if (taskDetailsActuallyChanged || labelsToAdd.length > 0 || labelsToRemove.length > 0 || labelOperationsErrorOccurred) {
            const finalTaskStateResult = await apiRequest<TaskWithLabels>(`/tasks/${taskToEdit.id}`, { method: 'GET' }, session);
            if (isApiError(finalTaskStateResult)) {
                setError(error || finalTaskStateResult.message || "Failed to fetch final updated task state.");
                onTaskUpdated(currentTaskStateFromApi);
            } else {
                onTaskUpdated(finalTaskStateResult);
            }
        } else if (!error) {
            onCancel();
        }
        setIsSubmitting(false);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title="Edit Task"
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div>
                    <label htmlFor="editTaskTitle" className="block text-sm font-medium mb-1">
                        Title <span className="text-destructive">*</span>
                    </label>
                    <Input
                        id="editTaskTitle"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor="editTaskDescription" className="block text-sm font-medium mb-1">
                        Description
                    </label>
                    <Textarea
                        id="editTaskDescription"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="editTaskProjectId" className="block text-sm font-medium mb-1">
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
                        <label htmlFor="editTaskStatus" className="block text-sm font-medium mb-1">
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

                <div>
                    <label htmlFor="taskLabels" className="block text-sm font-medium mb-1">
                        Labels
                    </label>
                    {areParentLabelsLoading ? (
                        <div className="text-sm text-muted-foreground py-2">Loading labels...</div>
                    ) : (
                        <CreatableSelect<LabelOption, true, GroupBase<LabelOption>>
                            id="taskLabels"
                            isMulti
                            components={animatedComponents}
                            options={userLabelOptions}
                            value={selectedLabelOptions}
                            onChange={(selectedOptions) => setSelectedLabelOptions(selectedOptions)}
                            onCreateOption={handleCreateLabel}
                            className="text-sm react-select-container"
                            classNamePrefix="react-select"
                            styles={colorStyles}
                            isDisabled={isSubmitting || isCreatingLabel || areParentLabelsLoading}
                            isLoading={isCreatingLabel || areParentLabelsLoading}
                            placeholder="Select or create labels..."
                            noOptionsMessage={({ inputValue }) =>
                                !inputValue && allUserLabels.length > 0
                                    ? "Start typing or create new"
                                    : allUserLabels.length === 0
                                        ? "No labels available. Type to create."
                                        : "No labels match. Type to create."
                            }
                        />
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting || isCreatingLabel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || isCreatingLabel || sessionStatus !== "authenticated" || areParentLabelsLoading}
                    >
                        {isSubmitting ? "Saving..." : isCreatingLabel ? "Creating Label..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}