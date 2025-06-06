// src/components/labels/LabelManager.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isApiError } from "@/services/common";
import { deleteLabel } from "@/services/labelApi";
import { Label } from "@/services/types";
import { Loader2, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import AddLabelForm from "./AddLabelForm";
import EditLabelForm from "./EditLabelForm";
import LabelChip from "./LabelChip";

interface LabelManagerProps {
    allUserLabels: Label[];
    isLoadingLabels: boolean;
    labelsError: string | null;
    onDataChanged: () => void;
}

export default function LabelManager({
    allUserLabels,
    isLoadingLabels,
    labelsError,
    onDataChanged,
}: LabelManagerProps) {
    const { data: session } = useSession();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (labelId: string) => {
        if (!session || !window.confirm("Are you sure you want to delete this label?")) return;

        setIsDeleting(labelId);
        try {
            const result = await deleteLabel(session, labelId);
            if (isApiError(result)) {
                toast.error("Failed to delete label", {
                    description: result.message
                });
            } else {
                toast.success("Label deleted successfully");
                onDataChanged();
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <CardTitle className="text-lg">Labels</CardTitle>
                <Button
                    size="sm"
                    onClick={() => {
                        setShowAddForm(!showAddForm);
                        setEditingLabel(null);
                    }}
                    disabled={isLoadingLabels}
                >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    {showAddForm ? "Cancel" : "Add Label"}
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {showAddForm && !editingLabel && (
                    <AddLabelForm
                        onLabelCreated={() => {
                            setShowAddForm(false);
                            onDataChanged();
                        }}
                        onCancel={() => setShowAddForm(false)}
                    />
                )}

                {editingLabel && (
                    <EditLabelForm
                        labelToEdit={editingLabel}
                        onLabelUpdated={() => {
                            setEditingLabel(null);
                            onDataChanged();
                        }}
                        onCancel={() => setEditingLabel(null)}
                    />
                )}

                {!showAddForm && !editingLabel && (
                    <>
                        {isLoadingLabels && allUserLabels.length === 0 && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        )}

                        {labelsError && (
                            <div className="text-sm text-destructive p-2 bg-destructive/10 rounded-md">
                                {labelsError}
                            </div>
                        )}

                        {!isLoadingLabels && !labelsError && allUserLabels.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No labels yet
                            </p>
                        )}

                        {allUserLabels.length > 0 && (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-2">
                                    {allUserLabels.map((label) => (
                                        <div
                                            key={label.id}
                                            className="p-3 rounded-md flex items-center justify-between hover:bg-accent"
                                        >
                                            <LabelChip label={label} />
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setEditingLabel(label)}
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(label.id)}
                                                    disabled={isDeleting === label.id}
                                                >
                                                    {isDeleting === label.id ? (
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
        </Card>
    );
}