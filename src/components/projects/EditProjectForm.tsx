// src/components/projects/EditProjectForm.tsx
"use client";

import { isApiError, Project, updateProject, UpdateProjectData } from "@/lib/apiClient";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";

interface EditProjectFormProps {
    projectToEdit: Project;
    onProjectUpdated: (updatedProject: Project) => void;
    onCancel: () => void;
}

export default function EditProjectForm({ projectToEdit, onProjectUpdated, onCancel }: EditProjectFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [name, setName] = useState(projectToEdit.name);
    const [color, setColor] = useState(projectToEdit.color || ""); // Utiliser chaîne vide si null
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Mettre à jour les champs si projectToEdit change (si le composant est réutilisé)
        setName(projectToEdit.name);
        setColor(projectToEdit.color || "");
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

        const newColor = color.trim() === "" ? null : color.trim();
        if (newColor !== projectToEdit.color) {
            updateData.color = newColor;
            hasChanges = true;
        }

        if (!hasChanges) {
            // setError("No changes detected."); // Ou simplement fermer
            onCancel(); // Fermer si pas de changements
            setIsSubmitting(false);
            return;
        }

        const result = await updateProject(session, projectToEdit.id, updateData);

        if (isApiError(result)) {
            setError(result.message || "Failed to update project.");
        } else {
            onProjectUpdated(result); // Informer le parent
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="relative w-full max-w-md space-y-4 p-6 bg-white rounded-lg shadow-xl">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-3">Edit Project</h3>

                <button
                    type="button"
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

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
                    <label htmlFor="editProjectColor" className="block text-sm font-medium text-gray-700 mb-1">
                        Color <span className="text-xs text-gray-500">(optional)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            id="editProjectColor"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
                            placeholder="#HexColor or CSS color name"
                            disabled={isSubmitting || sessionStatus !== "authenticated"}
                        />
                        {color.trim() !== "" && (
                            <span className="w-6 h-6 rounded-full border border-gray-300 inline-block" style={{ backgroundColor: color }}></span>
                        )}
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
        </div>
    );
}