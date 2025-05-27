// src/components/projects/ProjectList.tsx
"use client";

import { deleteProject, fetchProjects, isApiError, Project } from "@/lib/apiClient";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import AddProjectForm from "./AddProjectForm";
import EditProjectForm from "./EditProjectForm";

const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;

export default function ProjectList() {
    const { data: session, status: sessionStatus } = useSession(); // Obtenir aussi le statut
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const loadProjects = useCallback(async () => {
        if (sessionStatus === "authenticated" && session?.user?.id) { // Vérifier le statut aussi
            setIsLoading(true);
            setError(null);
            const result = await fetchProjects(session);
            if (isApiError(result)) {
                setError(result.message || "Failed to load projects.");
                setProjects([]);
            } else {
                setProjects(result);
            }
            setIsLoading(false);
        } else if (sessionStatus === "unauthenticated") {
            setIsLoading(false);
            setError("User not authenticated. Cannot fetch projects.");
            setProjects([]); // Vider les projets si non authentifié
        }
        // Si sessionStatus est "loading", on attend
    }, [session, sessionStatus]); // Ajouter sessionStatus aux dépendances

    useEffect(() => {
        // Charger les projets seulement si l'utilisateur est authentifié
        if (sessionStatus === "authenticated") {
            loadProjects();
        } else if (sessionStatus === "unauthenticated") {
            // Gérer le cas où l'utilisateur se déconnecte
            setProjects([]);
            setIsLoading(false);
            setError(null); // Ou un message "Please sign in"
        }
        // Ne rien faire si "loading"
    }, [sessionStatus, loadProjects]);

    const handleProjectCreated = (newProject: Project) => {
        setProjects(prevProjects =>
            [newProject, ...prevProjects].sort((a, b) => a.name.localeCompare(b.name)) // Ajoute et trie
        );
        //loadProjects();
        setShowAddForm(false);
    };

    const handleProjectUpdated = (updatedProject: Project) => {
        setProjects(prevProjects =>
            prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
                .sort((a, b) => a.name.localeCompare(b.name)) // Met à jour et trie
        );
        //loadProjects();
        setEditingProject(null);
    };

    const handleDeleteProject = async (projectId: string) => {
        if (sessionStatus !== "authenticated" || !session) {
            setError("Authentication required to delete.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this project? This action might also delete associated tasks.")) {
            return;
        }

        // Utiliser un état de chargement spécifique pour la suppression si vous voulez un feedback plus fin
        // Pour l'instant, on utilise le isLoading global ou on l'ignore pour la suppression
        const result = await deleteProject(session, projectId);

        if (isApiError(result)) {
            setError(result.message || "Failed to delete project.");
        } else {
            loadProjects();
            // alert(result.message); // Peut-être une notification plus discrète
            console.log(result.message);
        }
    };

    // Si la session est en cours de chargement par NextAuth, afficher un message global
    if (sessionStatus === "loading") {
        return <p className="text-gray-500 animate-pulse text-center py-10">Initializing session...</p>;
    }
    // Si pas de session (et pas en chargement), le middleware devrait avoir redirigé.
    // Ce cas est une fallback.
    if (!session && sessionStatus === "unauthenticated") {
        return <p className="text-red-500 text-center py-10">Session expired or user not authenticated.</p>;
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-700">Your Projects</h3>
                {!editingProject && ( // N'afficher le bouton "Add" que si on n'édite pas déjà
                    <button
                        onClick={() => { setShowAddForm(!showAddForm); setEditingProject(null); }}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors
                        ${showAddForm
                                ? "bg-gray-500 hover:bg-gray-600"
                                : "bg-blue-600 hover:bg-blue-700"}
                        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500`}
                    >
                        {showAddForm ? "Cancel" : "+ Add New Project"}
                    </button>
                )}
            </div>

            {showAddForm && !editingProject && (
                <AddProjectForm
                    onProjectCreated={handleProjectCreated}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {editingProject && (
                <EditProjectForm
                    projectToEdit={editingProject}
                    onProjectUpdated={handleProjectUpdated}
                    onCancel={() => setEditingProject(null)}
                />
            )}

            {isLoading && projects.length === 0 && !error && !showAddForm && !editingProject && (
                <p className="text-gray-500 animate-pulse text-center py-5">Loading projects...</p>
            )}

            {error && (
                <p className="text-red-500 bg-red-50 p-3 rounded-md border border-red-200 text-sm">Error: {error}</p>
            )}

            {!isLoading && !error && projects.length === 0 && !showAddForm && !editingProject && (
                <p className="text-gray-500 py-4 text-center border-t border-b mt-4">
                    No projects found. Click &quot;+ Add New Project&quot; to start!
                </p>
            )}

            {projects.length > 0 && !editingProject && !showAddForm && ( // N'afficher la liste que si aucun formulaire n'est actif
                <ul className="border rounded-md shadow-sm bg-white">
                    {projects.map((project) => (
                        <li key={project.id} className="py-3 px-4 border-b last:border-b-0 flex justify-between items-center group min-h-[60px]">
                            <div className="flex items-center space-x-3 min-w-0 flex-grow">
                                {project.color && (
                                    <span
                                        className="w-4 h-4 rounded-full inline-block flex-shrink-0 border"
                                        style={{ backgroundColor: project.color }}
                                        title={project.color || "No color"}
                                    ></span>
                                )}
                                <span className="font-medium text-gray-800 truncate" title={project.name}>{project.name}</span>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                    onClick={() => { setEditingProject(project); setShowAddForm(false); }}
                                    title="Edit project"
                                    className="p-2 text-gray-500 hover:text-blue-700 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(project.id)}
                                    title="Delete project"
                                    disabled={isLoading} // Pourrait désactiver pendant que la liste recharge
                                    className="p-2 text-gray-500 hover:text-red-700 rounded-md hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}