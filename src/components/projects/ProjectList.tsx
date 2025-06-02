"use client";

import { isApiError } from "@/services/common";
import { deleteProject } from "@/services/projectApi";
import { Project } from "@/services/types";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { DeleteIcon, EditIcon, PlusIcon } from "../ui/Icons";
import AddProjectForm from "./AddProjectForm";
import EditProjectForm from "./EditProjectForm";


interface ProjectListProps {
    projects: Project[];
    isLoading: boolean;
    error: string | null;
    onDataChanged: () => void;
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
    const { data: session } = useSession();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteProject = async (projectId: string) => {
        if (!session || !window.confirm("Are you sure you want to delete this project?")) return;

        setIsDeleting(projectId);
        setActionError(null);

        const result = await deleteProject(session, projectId);
        if (isApiError(result)) {
            setActionError(result.message || "Failed to delete project.");
        } else {
            onDataChanged();
            if (selectedProjectId === projectId && onProjectSelect) {
                onProjectSelect(null);
            }
        }
        setIsDeleting(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-700">Projects</h3>
                {!editingProject && (
                    <button
                        onClick={() => { setShowAddForm(prev => !prev); setEditingProject(null); setActionError(null); }}
                        className={`flex items-center px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors
                        ${showAddForm ? "bg-gray-500 hover:bg-gray-600" : "bg-blue-600 hover:bg-blue-700"}`}
                        disabled={!!isDeleting}
                    >
                        <PlusIcon /> <span className="ml-1">{showAddForm ? "Cancel" : "Add Project"}</span>
                    </button>
                )}
            </div>

            {actionError && <p className="text-xs text-red-600 bg-red-100 p-2 rounded-md">{actionError}</p>}

            {showAddForm && !editingProject && (
                <AddProjectForm
                    onProjectCreated={() => {
                        setShowAddForm(false);
                        onDataChanged();
                    }}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {editingProject && (
                <EditProjectForm
                    projectToEdit={editingProject}
                    onProjectUpdated={() => {
                        setEditingProject(null);
                        onDataChanged();
                    }}
                    onCancel={() => setEditingProject(null)}
                />
            )}

            <input
                type="text"
                placeholder="Search projects..."
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!!editingProject || showAddForm}
            />

            {isLoading && filteredProjects.length === 0 && !error && !showAddForm && !editingProject && (
                <p className="text-sm text-gray-500 animate-pulse text-center py-3">Loading projects...</p>
            )}

            {error && !actionError && !showAddForm && !editingProject && (
                <p className="text-sm text-red-500 bg-red-50 p-2 rounded-md">{error}</p>
            )}

            {!isLoading && !error && filteredProjects.length === 0 && !showAddForm && !editingProject && (
                <p className="text-sm text-gray-500 py-3 text-center border-t mt-2">
                    {searchTerm ? "No matching projects found" : "No projects yet"}
                </p>
            )}

            {filteredProjects.length > 0 && !editingProject && !showAddForm && (
                <ul className="border rounded-md shadow-sm bg-white max-h-96 overflow-y-auto">
                    <li
                        className={`py-2.5 px-3 border-b flex items-center group 
                            ${selectedProjectId === null ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                            transition-colors duration-150 cursor-pointer`}
                        onClick={() => onProjectSelect?.(null)}
                    >
                        <span className={`text-sm font-medium ${selectedProjectId === null ? 'text-blue-700' : 'text-gray-700'}`}>
                            All Tasks
                        </span>
                    </li>

                    {filteredProjects.map((project) => (
                        <li key={project.id}
                            className={`py-2.5 px-3 border-b last:border-b-0 flex justify-between items-center group 
                                        ${selectedProjectId === project.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                            onClick={() => onProjectSelect?.(project.id)}
                        >
                            <div className="flex items-center space-x-2.5 min-w-0 flex-grow">
                                {project.color && (
                                    <span className="w-3 h-3 rounded-full inline-block flex-shrink-0 border"
                                        style={{ backgroundColor: project.color }} />
                                )}
                                <span className={`text-sm font-medium truncate ${selectedProjectId === project.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                    {project.name}
                                </span>
                            </div>
                            <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingProject(project); }}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                    disabled={!!isDeleting}
                                    aria-label={`Edit project ${project.name}`}
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                    disabled={!!isDeleting}
                                    aria-label={`Delete project ${project.name}`}
                                >
                                    {isDeleting === project.id ? (
                                        <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-red-600 rounded-full"></span>
                                    ) : (
                                        <DeleteIcon />
                                    )}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}