// src/components/labels/AddLabelForm.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isApiError } from "@/services/common";
import { createLabel } from "@/services/labelApi";
import { CreateLabelPayload, Label as LabelT } from "@/services/types";
import { DEFAULT_COLOR_VALUE } from "@/utils/colors";
import { Loader2, PlusIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";

interface AddLabelFormProps {
    onLabelCreated: (newLabel: LabelT) => void;
    onCancel?: () => void;
}

export default function AddLabelForm({ onLabelCreated, onCancel }: AddLabelFormProps) {
    const { data: session } = useSession();
    const [name, setName] = useState("");
    const [color, setColor] = useState<string | null>(DEFAULT_COLOR_VALUE);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        setIsSubmitting(true);
        try {
            const labelData: CreateLabelPayload = {
                name: name.trim(),
                color: color,
            };

            const result = await createLabel(session, labelData);
            if (isApiError(result)) {
                throw new Error(result.message);
            }

            toast.success("Label created successfully");
            onLabelCreated(result);
            setName("");
            setColor(DEFAULT_COLOR_VALUE);
            if (onCancel) onCancel();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create label";
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
                <CardTitle>Create New Label</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="label-name">Label Name</Label>
                        <Input
                            id="label-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter label name"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Color (optional)</Label>
                        <ColorPicker
                            selectedColor={color}
                            onColorChange={setColor}
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
                            {isSubmitting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <PlusIcon className="mr-2 h-4 w-4" />
                            )}
                            Create Label
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}