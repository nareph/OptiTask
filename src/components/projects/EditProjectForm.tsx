// src/components/projects/EditProjectForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isApiError } from "@/services/common";
import { updateProject } from "@/services/projectApi";
import { Project, UpdateProjectData } from "@/services/types";
import { DEFAULT_NO_COLOR_VALUE } from "@/utils/colors";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditProjectFormProps {
    projectToEdit: Project;
    onProjectUpdated: (updatedProject: Project) => void;
    onCancel: () => void;
}

export default function EditProjectForm({
    projectToEdit,
    onProjectUpdated,
    onCancel
}: EditProjectFormProps) {
    const { data: session } = useSession();
    const [name, setName] = useState(projectToEdit.name);
    const [selectedColor, setSelectedColor] = useState<string | null>(projectToEdit.color || DEFAULT_NO_COLOR_VALUE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(projectToEdit.name);
        setSelectedColor(projectToEdit.color || DEFAULT_NO_COLOR_VALUE);
    }, [projectToEdit]);

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

        const updateData: UpdateProjectData = {};
        let hasChanges = false;

        if (name.trim() !== projectToEdit.name) {
            updateData.name = name.trim();
            hasChanges = true;
        }

        if (selectedColor !== projectToEdit.color) {
            updateData.color = selectedColor;
            hasChanges = true;
        }

        if (!hasChanges) {
            onCancel();
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await updateProject(session, projectToEdit.id, updateData);
            if (isApiError(result)) {
                throw new Error(result.message);
            }
            toast.success("Project updated successfully");
            onProjectUpdated(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update project";
            setError(message);
            toast.error("Update failed", {
                description: message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open onOpenChange={onCancel}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="edit-project-name">Project Name</Label>
                        <Input
                            id="edit-project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <ColorPicker
                            selectedColor={selectedColor}
                            onColorChange={setSelectedColor}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}