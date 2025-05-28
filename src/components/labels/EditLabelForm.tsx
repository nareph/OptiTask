// src/components/labels/EditLabelForm.tsx
"use client";

import { isApiError } from "@/services/common";
import { Label, updateLabel, UpdateLabelData } from "@/services/labelApi"; // UpdateLabelData pour le payload
import { DEFAULT_NO_COLOR_VALUE, PREDEFINED_COLORS } from "@/utils/colors";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";


interface EditLabelFormProps {
    labelToEdit: Label;
    onLabelUpdated: (updatedLabel: Label) => void;
    onCancel: () => void;
}

export default function EditLabelForm({ labelToEdit, onLabelUpdated, onCancel }: EditLabelFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [name, setName] = useState(labelToEdit.name);
    const [color, setColor] = useState<string | null>(labelToEdit.color || DEFAULT_NO_COLOR_VALUE);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setName(labelToEdit.name);
        setColor(labelToEdit.color || DEFAULT_NO_COLOR_VALUE);
    }, [labelToEdit]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!name.trim()) { setError("Label name is required."); return; }
        if (sessionStatus !== "authenticated" || !session) { setError("User session not available."); return; }
        setIsSubmitting(true);

        const updateData: UpdateLabelData = {};
        let changed = false;

        if (name.trim() !== labelToEdit.name) {
            updateData.name = name.trim();
            changed = true;
        }
        // Pour la couleur, on veut pouvoir la mettre à null ou la changer
        // La prop 'color' dans UpdateLabelData est Option<string | null | undefined>
        // Si la couleur est la même, on n'envoie pas le champ. Si elle a changé, on l'envoie.
        if (color !== labelToEdit.color) {
            updateData.color = color; // color est string | null
            changed = true;
        }

        if (!changed) {
            onCancel(); // Pas de changements, juste fermer
            setIsSubmitting(false);
            return;
        }

        const result = await updateLabel(session, labelToEdit.id, updateData);

        if (isApiError(result)) {
            setError(result.message || "Failed to update label.");
        } else {
            onLabelUpdated(result); // Le backend retourne le label mis à jour
            onCancel(); // Fermer le formulaire
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-60 overflow-y-auto h-full w-full flex items-center justify-center z-[60] p-4">
            <form onSubmit={handleSubmit} className="relative w-full max-w-sm space-y-4 p-5 bg-white rounded-lg shadow-xl">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Edit Label</h3>
                    <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded">{error}</p>}

                <div>
                    <label htmlFor="editLabelName" className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                    <input type="text" id="editLabelName" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                    <label htmlFor="editLabelColor" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex flex-wrap gap-2">
                        {PREDEFINED_COLORS.map(c => (
                            <button
                                type="button"
                                key={c.value}
                                title={c.name}
                                onClick={() => setColor(c.value)}
                                className={`w-6 h-6 rounded-full border-2 transition-all duration-150 
                                            ${color === c.value ? 'ring-2 ring-offset-1 ring-blue-500 border-blue-500' : 'border-gray-300 hover:border-gray-400'}`}
                                style={{ backgroundColor: c.value }}
                                disabled={isSubmitting}
                            />
                        ))}
                        <button
                            type="button"
                            title="No Color"
                            onClick={() => setColor(null)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-150
                                        ${color === null ? 'ring-2 ring-offset-1 ring-blue-500 bg-gray-100 border-blue-500' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                            disabled={isSubmitting}
                        >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-3 border-t mt-4">
                    <button type="button" onClick={onCancel} disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300">
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting || sessionStatus !== "authenticated"}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300">
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}