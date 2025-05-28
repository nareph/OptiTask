// src/components/projects/ProjectList.tsx
"use client";

import { isApiError } from "@/services/common";
import { deleteProject, Project } from "@/services/projectApi";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AddProjectForm from "./AddProjectForm";
import EditProjectForm from "./EditProjectForm";

const EditIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>;


interface ProjectListProps {
    projects: Project[]; // Reçu du parent
    isLoading: boolean;  // Reçu du parent (état de chargement global des projets)
    error: string | null; // Reçu du parent (erreur globale des projets)
    onDataChanged: () => void; // Callback pour notifier le parent que les données ont changé
    onProjectSelect?: (projectId: string | null) => void;
    selectedProjectId?: string | null;
}

export default function ProjectList({
    projects,
    isLoading,
    error,
    onDataChanged,
    onProjectSelect,
    selectedProjectId
}: ProjectListProps) {
    const { data: session, status: sessionStatus } = useSession();

    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    // États pour les opérations spécifiques à ce composant
    const [isPerformingAction, setIsPerformingAction] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);


    // Les formulaires AddProjectForm et EditProjectForm gèrent leurs propres appels API maintenant
    // et appellent onProjectCreated/onProjectUpdated qui appellent onDataChanged.

    const handleDeleteProject = async (projectId: string) => {
        if (sessionStatus !== "authenticated" || !session) {
            setActionError("Authentication required to delete.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this project? This may also delete associated tasks.")) return;

        setIsPerformingAction(true);
        setActionError(null);

        const result = await deleteProject(session, projectId);
        if (isApiError(result)) {
            setActionError(result.message || "Failed to delete project.");
        } else {
            onDataChanged(); // Notifier le parent de recharger
            // Vérifier si le projet supprimé était le projet sélectionné
            if (selectedProjectId === projectId && onProjectSelect) {
                onProjectSelect(null); // Désélectionner
            }
        }
        setIsPerformingAction(false);
    };

    if (sessionStatus === "loading") return <p className="text-sm text-gray-500 animate-pulse text-center py-3">Initializing session...</p>;
    // La redirection pour non-authentifié est gérée par le middleware de DashboardPage

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700">Projects</h3>
                {!editingProject && ( // N'afficher que si on n'édite pas
                    <button
                        onClick={() => { setShowAddForm(prev => !prev); setEditingProject(null); setActionError(null); }}
                        className={`flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors
                        ${showAddForm ? "bg-gray-500 hover:bg-gray-600" : "bg-blue-600 hover:bg-blue-700"}
                        focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        disabled={isPerformingAction}
                    >
                        <PlusIcon /> <span className="ml-1">{showAddForm ? "Cancel" : "Add Project"}</span>
                    </button>
                )}
            </div>

            {actionError && <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md">{actionError}</p>}

            {showAddForm && !editingProject && (
                <AddProjectForm
                    onProjectCreated={() => { // AddProjectForm a déjà fait l'appel API
                        setShowAddForm(false);
                        onDataChanged(); // Notifier le parent
                    }}
                    onCancel={() => { setShowAddForm(false); setActionError(null); }}
                />
            )}

            {editingProject && (
                <EditProjectForm
                    projectToEdit={editingProject}
                    onProjectUpdated={() => { // EditProjectForm a déjà fait l'appel API
                        setEditingProject(null);
                        onDataChanged(); // Notifier le parent
                    }}
                    onCancel={() => { setEditingProject(null); setActionError(null); }}
                />
            )}

            {/* Affichage des états de chargement/erreur globaux (passés par le parent) */}
            {isLoading && projects.length === 0 && !error && !showAddForm && !editingProject && (
                <p className="text-sm text-gray-500 animate-pulse text-center py-3">Loading projects...</p>
            )}
            {error && !actionError && !showAddForm && !editingProject && ( // N'afficher l'erreur globale que s'il n'y a pas d'erreur d'action locale
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">{error}</p>
            )}
            {!isLoading && !error && projects.length === 0 && !showAddForm && !editingProject && (
                <p className="text-sm text-gray-500 py-3 text-center border-t mt-2">
                    No projects yet. Click &quot;+ Add Project&quot; to create one.
                </p>
            )}

            {/* Liste des projets */}
            {projects.length > 0 && !editingProject && !showAddForm && (
                <ul className="border rounded-md shadow-sm bg-white max-h-96 overflow-y-auto">
                    {projects.map((project) => (
                        <li key={project.id}
                            className={`py-2.5 px-3 border-b last:border-b-0 flex justify-between items-center group 
                                        ${selectedProjectId === project.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                                        transition-colors duration-150 cursor-pointer`}
                            onClick={() => {
                                setActionError(null);
                                if (onProjectSelect) {
                                    onProjectSelect(selectedProjectId === project.id ? null : project.id);
                                }
                            }}
                            role="button" tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    setActionError(null);
                                    if (onProjectSelect) {
                                        onProjectSelect(project.id);
                                    }
                                }
                            }}
                        >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-grow">
                                {project.color && (<span className="w-3 h-3 rounded-full inline-block flex-shrink-0 border" style={{ backgroundColor: project.color }} title={project.color || "No color"}></span>)}
                                <span className={`text-sm font-medium truncate ${selectedProjectId === project.id ? 'text-blue-700' : 'text-gray-700'}`} title={project.name}> {project.name} </span>
                            </div>
                            <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex-shrink-0">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingProject(project); setShowAddForm(false); setActionError(null); }}
                                    title="Edit project"
                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                    disabled={isPerformingAction}
                                > <EditIcon /> </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                    title="Delete project"
                                    disabled={isPerformingAction}
                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                                >
                                    {isPerformingAction ? <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-red-600 rounded-full"></span> : <DeleteIcon />}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}