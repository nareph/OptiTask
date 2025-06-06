// src/components/labels/EditLabelForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isApiError } from "@/services/common";
import { updateLabel } from "@/services/labelApi";
import { Label as LabelT, UpdateLabelData } from "@/services/types";
import { DEFAULT_NO_COLOR_VALUE } from "@/utils/colors";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface EditLabelFormProps {
    labelToEdit: LabelT;
    onLabelUpdated: (updatedLabel: LabelT) => void;
    onCancel: () => void;
}

export default function EditLabelForm({
    labelToEdit,
    onLabelUpdated,
    onCancel
}: EditLabelFormProps) {
    const { data: session } = useSession();
    const [name, setName] = useState(labelToEdit.name);
    const [color, setColor] = useState<string | null>(labelToEdit.color || DEFAULT_NO_COLOR_VALUE);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setName(labelToEdit.name);
        setColor(labelToEdit.color || DEFAULT_NO_COLOR_VALUE);
    }, [labelToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Label name is required");
            return;
        }

        if (!session) {
            toast.error("Session not available");
            return;
        }

        const updateData: UpdateLabelData = {};
        let hasChanges = false;

        if (name.trim() !== labelToEdit.name) {
            updateData.name = name.trim();
            hasChanges = true;
        }

        if (color !== labelToEdit.color) {
            updateData.color = color;
            hasChanges = true;
        }

        if (!hasChanges) {
            onCancel();
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await updateLabel(session, labelToEdit.id, updateData);
            if (isApiError(result)) {
                throw new Error(result.message);
            }
            toast.success("Label updated successfully");
            onLabelUpdated(result);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update label";
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
                    <DialogTitle>Edit Label</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-label-name">Label Name</Label>
                        <Input
                            id="edit-label-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color</Label>
                        <ColorPicker
                            selectedColor={color}
                            onColorChange={setColor}
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
                            {isSubmitting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}