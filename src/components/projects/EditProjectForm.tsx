// src/components/projects/EditProjectForm.tsx
"use client";

import { isApiError } from "@/services/common";
import { updateProject } from "@/services/projectApi";
import { Project, UpdateProjectData } from "@/services/types";
import { DEFAULT_NO_COLOR_VALUE, PREDEFINED_COLORS } from "@/utils/colors"; // Importer depuis le fichier utilitaire
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { Modal } from "../ui/Modal";

interface EditProjectFormProps {
    projectToEdit: Project;
    onProjectUpdated: (updatedProject: Project) => void;
    onCancel: () => void;
}

export default function EditProjectForm({ projectToEdit, onProjectUpdated, onCancel }: EditProjectFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [name, setName] = useState(projectToEdit.name);
    // Utiliser selectedColor pour gérer string | null
    const [selectedColor, setSelectedColor] = useState<string | null>(projectToEdit.color || DEFAULT_NO_COLOR_VALUE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(projectToEdit.name);
        setSelectedColor(projectToEdit.color || DEFAULT_NO_COLOR_VALUE); // Assurer que c'est null si pas de couleur
    }, [projectToEdit]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Project name is required.");
            return;
        }
        if (sessionStatus !== "authenticated" || !session) {
            setError("User session not available. Please sign in again.");
            return;
        }

        setIsSubmitting(true);

        const updateData: UpdateProjectData = {};
        let hasChanges = false;

        if (name.trim() !== projectToEdit.name) {
            updateData.name = name.trim();
            hasChanges = true;
        }

        // Comparer selectedColor (string | null) avec projectToEdit.color (string | null)
        if (selectedColor !== projectToEdit.color) {
            updateData.color = selectedColor; // selectedColor est déjà string | null
            hasChanges = true;
        }

        if (!hasChanges) {
            onCancel();
            setIsSubmitting(false);
            return;
        }

        const result = await updateProject(session, projectToEdit.id, updateData);

        if (isApiError(result)) {
            setError(result.message || "Failed to update project.");
        } else {
            onProjectUpdated(result);
            // Pas besoin de onCancel() ici si onProjectUpdated ferme le formulaire,
            // sinon, vous pouvez l'appeler après onProjectUpdated(result);
        }
        setIsSubmitting(false);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title="Edit Project"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 my-2 text-sm text-red-700 bg-red-100 rounded-md border border-red-200" role="alert">
                        <span className="font-medium">Error:</span> {error}
                    </div>
                )}

                <div>
                    <label htmlFor="editProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                        Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="editProjectName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
                        required
                        disabled={isSubmitting || sessionStatus !== "authenticated"}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Color <span className="text-xs text-gray-500">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 items-center">
                        {PREDEFINED_COLORS.map((colorOption) => (
                            <button
                                type="button"
                                key={colorOption.value}
                                title={colorOption.name}
                                onClick={() => setSelectedColor(colorOption.value)}
                                className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ease-in-out 
                                            ${selectedColor === colorOption.value
                                        ? 'ring-2 ring-offset-1 ring-blue-500 border-blue-500 scale-110'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                style={{ backgroundColor: colorOption.value }}
                                disabled={isSubmitting || sessionStatus !== "authenticated"}
                            />
                        ))}
                        <button
                            type="button"
                            title="No Color"
                            onClick={() => setSelectedColor(null)}
                            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-gray-400
                                        transition-all duration-150 ease-in-out
                                        ${selectedColor === null
                                    ? 'ring-2 ring-offset-1 ring-blue-500 bg-gray-100 border-blue-500 scale-110'
                                    : 'border-gray-300 hover:border-gray-400 bg-white'
                                }`}
                            disabled={isSubmitting || sessionStatus !== "authenticated"}
                            aria-label="No color"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <div className="flex items-center space-x-3 pt-3 border-t mt-6">
                    <button
                        type="submit"
                        disabled={isSubmitting || sessionStatus !== "authenticated"}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
}
