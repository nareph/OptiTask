// src/components/tasks/EditTaskForm.tsx
"use client";

import { apiRequest, isApiError } from "@/services/common";
import { createLabel, CreateLabelPayload, Label } from "@/services/labelApi"; // createLabel et CreateLabelPayload sont nécessaires
import { Project } from "@/services/projectApi";
import { TaskWithLabels, updateTask, UpdateTaskData } from "@/services/taskApi";
import { addLabelToTask, removeLabelFromTask } from "@/services/taskLabelApi";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
// Importez CreatableSelect au lieu de Select
import { GroupBase, MultiValue, StylesConfig } from 'react-select';
import makeAnimated from 'react-select/animated';
import CreatableSelect from 'react-select/creatable';

const CloseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;

interface EditTaskFormProps {
    taskToEdit: TaskWithLabels;
    onTaskUpdated: (updatedTask: TaskWithLabels) => void;
    onCancel: () => void;
    projects: Project[];
    allUserLabels: Label[];
    onLabelCreatedInForm: (newLabel: Label) => void; // Nouvelle prop pour gérer la création de label
    areParentLabelsLoading?: boolean;
}

interface LabelOption {
    readonly value: string; // label.id
    readonly label: string; // label.name
    readonly color?: string | null;
    readonly __isNew__?: boolean; // Ajouté par CreatableSelect pour les nouvelles options
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
    onLabelCreatedInForm, // Récupérer la nouvelle prop
    areParentLabelsLoading = false
}: EditTaskFormProps) {
    const { data: session, status: sessionStatus } = useSession();

    const [title, setTitle] = useState(taskToEdit.title);
    const [description, setDescription] = useState(taskToEdit.description || "");
    const [projectId, setProjectId] = useState(taskToEdit.project_id || "");
    const [status, setStatus] = useState(taskToEdit.status);
    const [dueDate, setDueDate] = useState(taskToEdit.due_date || "");
    const [selectedLabelOptions, setSelectedLabelOptions] = useState<MultiValue<LabelOption>>(() =>
        taskToEdit.labels.map(l => ({ value: l.id, label: l.name, color: l.color }))
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCreatingLabel, setIsCreatingLabel] = useState(false); // Pour le chargement de création de label
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || "");
        setProjectId(taskToEdit.project_id || "");
        setStatus(taskToEdit.status);
        setDueDate(taskToEdit.due_date || "");
        setSelectedLabelOptions(taskToEdit.labels.map(l => ({ value: l.id, label: l.name, color: l.color })));
    }, [taskToEdit]);

    const userLabelOptions: LabelOption[] = allUserLabels.map(l => ({
        value: l.id,
        label: l.name,
        color: l.color,
    }));

    const handleCreateLabel = async (inputValue: string) => {
        if (!session || !inputValue.trim()) return;
        setError(null); // Clear previous errors
        setIsCreatingLabel(true);

        // Vous pouvez choisir une couleur par défaut ou laisser l'utilisateur la choisir plus tard
        const newLabelData: CreateLabelPayload = { name: inputValue.trim(), color: null };
        const result = await createLabel(session, newLabelData);

        setIsCreatingLabel(false);
        if (!isApiError(result)) {
            onLabelCreatedInForm(result); // Notifier le parent (DashboardPage)
            const newOption: LabelOption = { value: result.id, label: result.name, color: result.color };
            setSelectedLabelOptions(prev => [...prev, newOption]); // Ajouter et sélectionner le nouveau label
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
        const newDueDateVal = dueDate.trim() === "" ? null : dueDate.trim();
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
                onTaskUpdated(finalTaskStateResult); // OnTaskUpdated devrait gérer l'affichage de l'erreur s'il y en a une
            }
        } else if (!error) { // S'il n'y a eu aucun changement et aucune erreur
            onCancel();
        }
        setIsSubmitting(false);
    };


    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="relative w-full max-w-lg space-y-3 p-6 bg-white rounded-xl shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Edit Task</h3>
                    <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100">
                        <CloseIcon />
                    </button>
                </div>
                {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md border border-red-300">{error}</p>}

                {/* Champs du formulaire (title, description, project, status, dueDate) - inchangés */}
                <div>
                    <label htmlFor="editTaskTitle" className="block text-xs font-medium text-gray-600 mb-0.5">Title <span className="text-red-500">*</span></label>
                    <input type="text" id="editTaskTitle" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isSubmitting}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="editTaskDescription" className="block text-xs font-medium text-gray-600 mb-0.5">Description</label>
                    <textarea id="editTaskDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} disabled={isSubmitting}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label htmlFor="editTaskProjectId" className="block text-xs font-medium text-gray-600 mb-0.5">Project</label>
                        <select id="editTaskProjectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={isSubmitting}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="">No Project</option>
                            {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="editTaskStatus" className="block text-xs font-medium text-gray-600 mb-0.5">Status</label>
                        <select id="editTaskStatus" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSubmitting}
                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
                            <option value="todo">To Do</option> <option value="inprogress">In Progress</option> <option value="done">Done</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor="editTaskDueDate" className="block text-xs font-medium text-gray-600 mb-0.5">Due Date</label>
                    <input type="date" id="editTaskDueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={isSubmitting}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                {/* Fin des champs inchangés */}

                <div>
                    <label htmlFor="taskLabels" className="block text-xs font-medium text-gray-600 mb-0.5">Labels</label>
                    {areParentLabelsLoading ? <p className="text-xs text-gray-500 py-1">Loading labels...</p> : (
                        <CreatableSelect<LabelOption, true, GroupBase<LabelOption>> // Utiliser CreatableSelect
                            id="taskLabels"
                            isMulti
                            components={animatedComponents}
                            options={userLabelOptions}
                            value={selectedLabelOptions}
                            onChange={(selectedOptions: MultiValue<LabelOption>) => {
                                // Gérer la sélection normale
                                setSelectedLabelOptions(selectedOptions);
                            }}
                            onCreateOption={handleCreateLabel} // Gérer la création d'une nouvelle option
                            formatCreateLabel={(inputValue) => `Create new label: "${inputValue}"`} // Texte pour la nouvelle option
                            className="text-sm react-select-container"
                            classNamePrefix="react-select"
                            styles={colorStyles}
                            isDisabled={isSubmitting || isCreatingLabel || areParentLabelsLoading} // Désactiver pendant la création de label aussi
                            isLoading={isCreatingLabel || areParentLabelsLoading} // Afficher le spinner si création de label ou chargement parent
                            placeholder="Select or create labels..."
                            noOptionsMessage={({ inputValue }) =>
                                !inputValue && allUserLabels.length > 0 ? "Start typing or create new" :
                                    allUserLabels.length === 0 ? "No labels available. Type to create." :
                                        "No labels match. Type to create."
                            }
                        />
                    )}
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4 border-t mt-4">
                    <button type="button" onClick={onCancel} disabled={isSubmitting || isCreatingLabel}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting || isCreatingLabel || sessionStatus !== "authenticated" || areParentLabelsLoading}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                        {isSubmitting ? "Saving..." : (isCreatingLabel ? "Creating Label..." : "Save Changes")}
                    </button>
                </div>
            </form>
        </div>
    );
}