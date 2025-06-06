// src/components/projects/ProjectList.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isApiError } from "@/services/common";
import { deleteProject } from "@/services/projectApi";
import { Project } from "@/services/types";
import { Loader2, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import AddProjectForm from "./AddProjectForm";
import EditProjectForm from "./EditProjectForm";

interface ProjectListProps {
    projects: Project[];
    isLoading: boolean;
    error: string | null;
    onDataChanged: () => void;
    onProjectSelect: (project: Project | null) => void;
    selectedProject: Project | null;
}

export default function ProjectList({
    projects,
    isLoading,
    error,
    onDataChanged,
    onProjectSelect,
    selectedProject
}: ProjectListProps) {
    const { data: session } = useSession();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = projects.filter(project =>
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (projectId: string) => {
        if (!session || !window.confirm("Are you sure you want to delete this project?")) return;

        setIsDeleting(projectId);
        try {
            const result = await deleteProject(session, projectId);
            if (isApiError(result)) {
                toast.error("Failed to delete project", {
                    description: result.message
                });
            } else {
                toast.success("Project deleted successfully");
                onDataChanged();
                if (selectedProject?.id === projectId) {
                    onProjectSelect(null);
                }
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-4">
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-lg">Projects</CardTitle>
                <Button
                    size="sm"
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        setEditingProject(null);
                    }}
                    disabled={isLoading}
                >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {showAddForm ? "Cancel" : "Add Project"}
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
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
                        onProjectUpdated={(updatedProject) => {
                            setEditingProject(null);
                            onDataChanged();
                            if (selectedProject?.id === updatedProject.id) {
                                onProjectSelect(updatedProject);
                            }
                        }}
                        onCancel={() => setEditingProject(null)}
                    />
                )}

                {!showAddForm && !editingProject && (
                    <>
                        <Input
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={isLoading}
                        />

                        {isLoading && filteredProjects.length === 0 && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}

                        {error && (
                            <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                                {error}
                            </div>
                        )}

                        {!isLoading && !error && filteredProjects.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                {searchTerm ? "No matching projects found" : "No projects yet"}
                            </p>
                        )}

                        {filteredProjects.length > 0 && (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-1">
                                    <div
                                        className={`p-3 rounded-md cursor-pointer flex items-center ${!selectedProject ? 'bg-accent' : 'hover:bg-accent'
                                            }`}
                                        onClick={() => onProjectSelect(null)}
                                    >
                                        <span className="flex-1">All Tasks</span>
                                    </div>

                                    {filteredProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            className={`p-3 rounded-md flex items-center justify-between ${selectedProject?.id === project.id ? 'bg-accent' : 'hover:bg-accent'
                                                }`}
                                            onClick={() => onProjectSelect(project)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {project.color && (
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: project.color }}
                                                    />
                                                )}
                                                <span className="truncate">{project.name}</span>
                                            </div>

                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingProject(project);
                                                    }}
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(project.id);
                                                    }}
                                                    disabled={isDeleting === project.id}
                                                >
                                                    {isDeleting === project.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <TrashIcon className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </>
                )}
            </CardContent>
        </div>
    );
}