// src/components/projects/AddProjectForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isApiError } from "@/services/common";
import { createProject } from "@/services/projectApi";
import { CreateProjectPayload, Project } from "@/services/types";
import { DEFAULT_COLOR_VALUE } from "@/utils/colors";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface AddProjectFormProps {
    onProjectCreated: (newProject: Project) => void;
    onCancel?: () => void;
}

export default function AddProjectForm({ onProjectCreated, onCancel }: AddProjectFormProps) {
    const { data: session } = useSession();
    const [name, setName] = useState("");
    const [selectedColor, setSelectedColor] = useState<string | null>(DEFAULT_COLOR_VALUE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Project name is required");
            return;
        }

        if (!session) {
            setError("Session not available");
            return;
        }

        setIsSubmitting(true);
        try {
            const projectData: CreateProjectPayload = {
                name: name.trim(),
                color: selectedColor
            };

            const result = await createProject(session, projectData);
            if (isApiError(result)) {
                throw new Error(result.message);
            }

            toast.success("Project created successfully");
            onProjectCreated(result);
            setName("");
            setSelectedColor(DEFAULT_COLOR_VALUE);
            if (onCancel) onCancel();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create project";
            setError(message);
            toast.error("Creation failed", {
                description: message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter project name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color (optional)</Label>
                        <ColorPicker
                            selectedColor={selectedColor}
                            onColorChange={setSelectedColor}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Project
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}