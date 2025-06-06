// src/components/projects/ProjectsView.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label, Project } from "@/services/types";
import { useState } from "react";
import LabelManager from "../labels/LabelManager";
import TaskList from "../tasks/TaskList";
import ProjectList from "./ProjectList";

interface ProjectsViewProps {
    projects: Project[];
    allUserLabels: Label[];
    onDataChanged: () => void;
    onLabelCreated: (newLabel: Label) => void;
    isLoading: boolean;
    error: string | null;
    onPomodoroStateChange: (isActive: boolean) => void;
}

export default function ProjectsView({
    projects,
    allUserLabels,
    onDataChanged,
    onLabelCreated,
    isLoading,
    error,
    onPomodoroStateChange
}: ProjectsViewProps) {
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
                <Card>
                    <Tabs defaultValue="projects" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="labels">Labels</TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects">
                            <ProjectList
                                projects={projects}
                                isLoading={isLoading}
                                error={error}
                                onDataChanged={onDataChanged}
                                onProjectSelect={(project) => setSelectedProject(project)}
                                selectedProject={selectedProject}
                            />
                        </TabsContent>

                        <TabsContent value="labels">
                            <LabelManager
                                allUserLabels={allUserLabels}
                                isLoadingLabels={isLoading}
                                labelsError={error}
                                onDataChanged={onDataChanged}
                            />
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>

            <div className="lg:col-span-8 xl:col-span-9">
                <Card>
                    <TaskList
                        projectIdForFilter={selectedProject?.id || null}
                        projectNameForFilter={selectedProject?.name || "All Tasks"}
                        projectsForForms={projects}
                        allUserLabelsForForms={allUserLabels}
                        onTasksDataChanged={onDataChanged}
                        onLabelCreatedInTaskForm={onLabelCreated}
                        areParentResourcesLoading={isLoading}
                        onPomodoroStateChange={onPomodoroStateChange}
                    />
                </Card>
            </div>
        </div>
    );
}