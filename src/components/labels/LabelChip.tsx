// src/components/labels/LabelChip.tsx

import { Label } from "@/services/types";

interface LabelChipProps {
    label: Label;
    onRemove?: (labelId: string) => void;
    size?: 'sm' | 'xs';
    className?: string; // Permettre de passer des classes supplémentaires
}

export default function LabelChip({ label, onRemove, size = 'xs', className = '' }: LabelChipProps) {
    const textSize = size === 'sm' ? 'text-sm' : 'text-xs';
    const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-2 py-0.5'; // Ajusté py pour sm

    // Générer une couleur de texte contrastante (très basique)
    const getContrastYIQ = (hexcolor: string | null | undefined): string => {
        if (!hexcolor) return '#374151'; // Default dark gray
        const color = hexcolor.charAt(0) === '#' ? hexcolor.substring(1, 7) : hexcolor;
        if (color.length !== 6) return '#374151'; // Si pas hex valide
        const r = parseInt(color.substring(0, 2), 16);
        const g = parseInt(color.substring(2, 4), 16);
        const b = parseInt(color.substring(4, 6), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF'; // Retourne noir ou blanc
    };

    const textColor = getContrastYIQ(label.color);
    const chipBackgroundColor = label.color || '#E5E7EB'; // Gris par défaut si pas de couleur

    return (
        <span
            className={`inline-flex items-center ${padding} rounded-full ${textSize} font-medium border ${className}`}
            style={{
                backgroundColor: chipBackgroundColor,
                borderColor: label.color || '#D1D5DB', // Une bordure un peu plus foncée ou de la même couleur
                color: textColor,
            }}
            title={label.name}
        >
            {label.name}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(label.id); }} // Stop propagation si le chip est cliquable
                    className={`ml-1.5 flex-shrink-0 rounded-full inline-flex items-center justify-center 
                      h-4 w-4 focus:outline-none focus:ring-1 focus:ring-offset-0`}
                    style={{
                        color: textColor, // Utilise la même couleur de texte contrastante
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = `rgba(0,0,0,0.1)`} // Effet de survol subtil
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    aria-label={`Remove ${label.name}`}
                >
                    <span className="sr-only">Remove {label.name}</span>
                    <svg className="h-2.5 w-2.5" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                    </svg>
                </button>
            )}
        </span>
    );
}