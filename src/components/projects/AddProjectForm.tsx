// src/components/projects/AddProjectForm.tsx
"use client";

import { isApiError } from "@/services/common";
import { createProject, CreateProjectPayload, Project } from "@/services/projectApi";
import { DEFAULT_COLOR_VALUE, PREDEFINED_COLORS } from "@/utils/colors";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";

interface AddProjectFormProps {
    onProjectCreated: (newProject: Project) => void;
    onCancel?: () => void;
}


export default function AddProjectForm({ onProjectCreated, onCancel }: AddProjectFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [name, setName] = useState("");
    // Initialiser avec une couleur par défaut ou null si "pas de couleur" est la préférence initiale
    const [selectedColor, setSelectedColor] = useState<string | null>(DEFAULT_COLOR_VALUE); // Bleu par défaut
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

        const projectData: CreateProjectPayload = {
            name: name.trim(),
            color: selectedColor, // `selectedColor` est déjà string | null
        };

        const result = await createProject(session, projectData);

        if (isApiError(result)) {
            setError(result.message || "Failed to create project. Please try again.");
        } else {
            onProjectCreated(result);
            setName("");
            setSelectedColor(DEFAULT_COLOR_VALUE); // Réinitialiser à la couleur par défaut
            // if (onCancel) onCancel(); // Dépend si vous voulez fermer automatiquement
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-200 rounded-lg shadow-sm mb-6 bg-white">
            <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Create New Project</h3>

            {error && (
                <div className="p-3 my-2 text-sm text-red-700 bg-red-100 rounded-md border border-red-200" role="alert">
                    <span className="font-medium">Error:</span> {error}
                </div>
            )}

            <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="projectName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
                    placeholder="e.g., Marketing Campaign Q3"
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
                    <button // Bouton pour "pas de couleur"
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

            <div className="flex items-center space-x-3 pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting || sessionStatus !== "authenticated"}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "Creating..." : "Create Project"}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}