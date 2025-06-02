"use client";

import { Label, Project } from "@/services/types";
import { useState } from "react";
import LabelManager from "../labels/LabelManager";
import ProjectList from "./ProjectList";
import TaskList from "../tasks/TaskList";

interface ProjectsViewProps {
    projects: Project[];
    allUserLabels: Label[];
    onDataChanged: () => void;
    onLabelCreated: (newLabel: Label) => void;
    isLoading: boolean;
    error: string | null;
}

export default function ProjectsView({
    projects,
    allUserLabels,
    onDataChanged,
    onLabelCreated,
    isLoading,
    error
}: ProjectsViewProps) {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [activeTab, setActiveTab] = useState<'projects' | 'labels'>('projects');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="flex border-b">
                        <button
                            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'projects' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('projects')}
                        >
                            Projects
                        </button>
                        <button
                            className={`flex-1 py-3 font-medium text-sm ${activeTab === 'labels' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                            onClick={() => setActiveTab('labels')}
                        >
                            Labels
                        </button>
                    </div>

                    <div className="p-4">
                        {activeTab === 'projects' ? (
                            <ProjectList
                                projects={projects}
                                isLoading={isLoading}
                                error={error}
                                onDataChanged={onDataChanged}
                                onProjectSelect={(projectId) => {
                                    setSelectedProject(projectId ? projects.find(p => p.id === projectId) || null : null);
                                }}
                                selectedProjectId={selectedProject?.id || null}
                            />
                        ) : (
                            <LabelManager
                                allUserLabels={allUserLabels}
                                isLoadingLabels={isLoading}
                                labelsError={error}
                                onDataChanged={onDataChanged}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8 xl:col-span-9">
                <div className="p-4 bg-white shadow-md rounded-lg">
                    <TaskList
                        projectIdForFilter={selectedProject?.id || null}
                        projectNameForFilter={selectedProject?.name || "All Tasks"}
                        projectsForForms={projects}
                        allUserLabelsForForms={allUserLabels}
                        onTasksDataChanged={onDataChanged}
                        onLabelCreatedInTaskForm={onLabelCreated}
                        areParentResourcesLoading={isLoading}
                    />
                </div>
            </div>
        </div>
    );
}