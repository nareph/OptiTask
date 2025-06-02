/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/labels/LabelManager.tsx
"use client";

import { isApiError } from "@/services/common";
import { createLabel, deleteLabel, updateLabel } // Importer createLabel, updateLabel
    from "@/services/labelApi";
import { Label } from "@/services/types";
import { useSession } from "next-auth/react";
import { useState } from "react";
import AddLabelForm from "./AddLabelForm";
import EditLabelForm from "./EditLabelForm";
import LabelChip from "./LabelChip";

const PlusCircleIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
const EditIconMini = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>;
const DeleteIconMini = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>;

interface LabelManagerProps {
    allUserLabels: Label[];
    isLoadingLabels: boolean; // Reçu du parent
    labelsError: string | null; // Reçu du parent
    onDataChanged: () => void; // Callback pour notifier le parent
}

export default function LabelManager({
    allUserLabels,
    isLoadingLabels,
    labelsError,
    onDataChanged,
}: LabelManagerProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [showAddLabelForm, setShowAddLabelForm] = useState(false);
    const [editingLabel, setEditingLabel] = useState<Label | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [itemError, setItemError] = useState<string | null>(null);

    const handleLabelCreated = async (labelData: Omit<Label, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
        if (!session || sessionStatus !== "authenticated") { setItemError("Not authenticated."); return; }
        setIsSubmitting(true); setItemError(null);
        const result = await createLabel(session, labelData);
        if (isApiError(result)) {
            setItemError(result.message);
        } else {
            setShowAddLabelForm(false);
            onDataChanged(); // Notifier le parent
        }
        setIsSubmitting(false);
    };

    const handleLabelUpdated = async (labelId: string, labelData: Partial<Label>) => {
        if (!session || sessionStatus !== "authenticated") { setItemError("Not authenticated."); return; }
        setIsSubmitting(true); setItemError(null);
        const result = await updateLabel(session, labelId, labelData);
        if (isApiError(result)) {
            setItemError(result.message);
        } else {
            setEditingLabel(null);
            onDataChanged(); // Notifier le parent
        }
        setIsSubmitting(false);
    };

    const handleDeleteLabel = async (labelId: string) => {
        if (!session || sessionStatus !== "authenticated") { setItemError("Not authenticated."); return; }
        if (!window.confirm("Are you sure you want to delete this label?")) return;
        setIsSubmitting(true); setItemError(null);
        const result = await deleteLabel(session, labelId);
        if (isApiError(result)) {
            setItemError(result.message);
        } else {
            onDataChanged(); // Notifier le parent
        }
        setIsSubmitting(false);
    };

    if (sessionStatus === "loading") return <p className="text-xs text-gray-400 p-2">Waiting for session...</p>;
    if (!session && sessionStatus === "unauthenticated") return <p className="text-xs text-red-500 p-2">Please sign in.</p>;


    return (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-semibold text-gray-700">Manage Labels</h3>
                {!editingLabel && (
                    <button onClick={() => { setShowAddLabelForm(prev => !prev); setEditingLabel(null); setItemError(null); }} className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100" title={showAddLabelForm ? "Cancel Add Label" : "Add New Label"} >
                        <PlusCircleIcon />
                    </button>
                )}
            </div>

            {itemError && <p className="text-xs text-red-600 bg-red-100 p-1.5 rounded mb-2">{itemError}</p>}

            {showAddLabelForm && !editingLabel && (
                <AddLabelForm
                    // AddLabelForm va maintenant faire l'appel API et appeler onLabelCreated
                    onLabelCreated={(_newLabelData) => {
                        // Mieux: AddLabelForm retourne les données, LabelManager appelle createLabel
                        // Pour l'instant, on assume que AddLabelForm appelle createLabel.
                        onDataChanged(); // Notifier le parent que la liste des labels a pu changer
                        setShowAddLabelForm(false);
                    }}
                    onCancel={() => { setShowAddLabelForm(false); setItemError(null); }}
                />
            )}

            {editingLabel && (
                <EditLabelForm
                    labelToEdit={editingLabel}
                    onLabelUpdated={(_updatedLabelData) => {
                        onDataChanged(); // Notifier le parent
                        setEditingLabel(null);
                    }}
                    onCancel={() => { setEditingLabel(null); setItemError(null); }}
                />
            )}

            {isLoadingLabels && allUserLabels.length === 0 && <p className="text-xs text-gray-400 p-1 animate-pulse">Loading labels...</p>}

            {/* Afficher l'erreur globale du parent si pas d'erreur locale et pas de formulaire actif */}
            {labelsError && !itemError && !showAddLabelForm && !editingLabel && (
                <p className="text-xs text-red-600 bg-red-100 p-1.5 rounded mb-2">{labelsError}</p>
            )}

            {!isLoadingLabels && !labelsError && allUserLabels.length === 0 && !showAddLabelForm && !editingLabel && (
                <p className="text-xs text-gray-500 p-1">No labels yet.</p>
            )}

            {!isLoadingLabels && allUserLabels.length > 0 && !showAddLabelForm && !editingLabel && (
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto pr-1">
                    {allUserLabels.map(label => (
                        <div key={label.id} className="flex items-center justify-between p-1.5 bg-white border rounded-md text-xs group hover:bg-gray-50">
                            <LabelChip label={label} size="xs" />
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                <button onClick={() => { setEditingLabel(label); setShowAddLabelForm(false); setItemError(null); }} className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50" title="Edit Label" disabled={isSubmitting}> <EditIconMini /> </button>
                                <button onClick={() => handleDeleteLabel(label.id)} className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50" title="Delete Label" disabled={isSubmitting}>
                                    {isSubmitting ? <span className="animate-spin inline-block w-3 h-3 border-2 border-current border-t-transparent text-red-500 rounded-full"></span> : <DeleteIconMini />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}