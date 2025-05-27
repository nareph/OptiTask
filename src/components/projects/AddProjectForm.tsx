"use client"; // Ce composant utilise des hooks React

import { isApiError } from "@/services/common";
import { createProject, CreateProjectPayload, Project } from "@/services/projectApi";
import { useSession } from "next-auth/react"; // Pour obtenir la session
import { FormEvent, useState } from "react";

interface AddProjectFormProps {
    onProjectCreated: (newProject: Project) => void; // Callback pour informer le parent que le projet a été créé
    onCancel?: () => void; // Callback optionnel pour annuler/fermer le formulaire
}

export default function AddProjectForm({ onProjectCreated, onCancel }: AddProjectFormProps) {
    const { data: session, status: sessionStatus } = useSession(); // Obtenir la session et son statut
    const [name, setName] = useState("");
    const [color, setColor] = useState(""); // Laisser vide pour pas de couleur, ou l'utilisateur entre un hex
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null); // Réinitialiser l'erreur à chaque soumission

        if (!name.trim()) {
            setError("Project name is required.");
            return;
        }

        if (sessionStatus !== "authenticated" || !session) {
            setError("User session not available or not authenticated. Please sign in again.");
            // Optionnel: rediriger ou afficher un message plus proéminent
            return;
        }

        setIsSubmitting(true);

        const projectData: CreateProjectPayload = {
            name: name.trim(),
            // Envoyer null si la couleur est vide, sinon la couleur.
            // La fonction createProject dans apiClient s'occupera de la transformation undefined -> null
            color: color.trim() === "" ? null : color.trim(),
        };

        const result = await createProject(session, projectData); // Utiliser la fonction de apiClient

        if (isApiError(result)) { // Utiliser le type guard
            setError(result.message || "Failed to create project. Please try again.");
        } else { // Succès, result est de type Project
            onProjectCreated(result); // Informer le parent
            setName(""); // Réinitialiser le formulaire
            setColor("");
            // Si onCancel est fourni, on peut l'appeler ici, par exemple
            // if (onCancel) onCancel();
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
                <label htmlFor="projectColor" className="block text-sm font-medium text-gray-700 mb-1">
                    Color <span className="text-xs text-gray-500">(optional, e.g., #FF5733 or lightblue)</span>
                </label>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        id="projectColor"
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