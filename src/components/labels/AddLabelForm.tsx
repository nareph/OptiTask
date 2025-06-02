// src/components/labels/AddLabelForm.tsx
"use client";

import { isApiError } from "@/services/common";
import { createLabel } from "@/services/labelApi";
import { CreateLabelPayload, Label } from "@/services/types";
import { DEFAULT_COLOR_VALUE, PREDEFINED_COLORS } from "@/utils/colors";
import { useSession } from "next-auth/react";
import { FormEvent, useState } from "react";


interface AddLabelFormProps {
    onLabelCreated: (newLabel: Label) => void;
    onCancel?: () => void; // Optionnel pour fermer un mode "ajout"
}

export default function AddLabelForm({ onLabelCreated, onCancel }: AddLabelFormProps) {
    const { data: session, status: sessionStatus } = useSession();
    const [name, setName] = useState("");
    const [color, setColor] = useState<string | null>(DEFAULT_COLOR_VALUE); // Default Blue
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        if (!name.trim()) { setError("Label name is required."); return; }
        if (sessionStatus !== "authenticated" || !session) { setError("User session not available."); return; }
        setIsSubmitting(true);

        const labelData: CreateLabelPayload = {
            name: name.trim(),
            color: color,
        };

        const result = await createLabel(session, labelData);

        if (isApiError(result)) {
            setError(result.message || "Failed to create label.");
        } else {
            onLabelCreated(result);
            setName("");
            setColor(DEFAULT_COLOR_VALUE); // Reset à la couleur par défaut
            if (onCancel) onCancel();
        }
        setIsSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm mt-2">
            <h4 className="text-sm font-semibold text-gray-700">Create New Label</h4>
            {error && <p className="text-xs text-red-600 bg-red-100 p-1.5 rounded">{error}</p>}

            <div>
                <label htmlFor="addLabelName" className="block text-xs font-medium text-gray-600 mb-0.5">Name <span className="text-red-500">*</span></label>
                <input type="text" id="addLabelName" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting}
                    className="w-full px-2.5 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="addLabelColor" className="block text-xs font-medium text-gray-600 mb-0.5">Color</label>
                <div className="flex flex-wrap gap-1.5">
                    {PREDEFINED_COLORS.map(c => (
                        <button
                            type="button"
                            key={c.value}
                            title={c.name}
                            onClick={() => setColor(c.value)}
                            className={`w-5 h-5 rounded-full border-2 transition-all duration-150 
                                        ${color === c.value ? 'ring-2 ring-offset-1 ring-blue-500' : 'border-gray-300 hover:border-gray-400'}`}
                            style={{ backgroundColor: c.value }}
                            disabled={isSubmitting}
                        />
                    ))}
                    <button // Bouton pour "pas de couleur"
                        type="button"
                        title="No Color"
                        onClick={() => setColor(null)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150
                                    ${color === null ? 'ring-2 ring-offset-1 ring-blue-500 bg-gray-100' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
                        disabled={isSubmitting}
                    >
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-1">
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={isSubmitting}
                        className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Cancel
                    </button>
                )}
                <button type="submit" disabled={isSubmitting || sessionStatus !== "authenticated"}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300">
                    {isSubmitting ? "Creating..." : "Create Label"}
                </button>
            </div>
        </form>
    );
}