// src/components/labels/LabelChip.tsx
import { cn } from "@/lib/utils";
import { Label } from "@/services/types";

interface LabelChipProps {
    label: Label;
    onRemove?: (labelId: string) => void;
    size?: 'sm' | 'xs';
    className?: string;
}

export default function LabelChip({
    label,
    onRemove,
    size = 'xs',
    className = ''
}: LabelChipProps) {
    const textSize = size === 'sm' ? 'text-sm' : 'text-xs';
    const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-2 py-0.5';

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full font-medium border",
                textSize,
                padding,
                className
            )}
            style={{
                backgroundColor: label.color || 'hsl(var(--accent))',
                borderColor: label.color || 'hsl(var(--border))',
                color: label.color ? getContrastColor(label.color) : 'hsl(var(--foreground))'
            }}
            title={label.name}
        >
            {label.name}
            {onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(label.id);
                    }}
                    className="ml-1.5 rounded-full inline-flex items-center justify-center h-4 w-4"
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

// Helper pour obtenir une couleur de texte contrastante
function getContrastColor(hexColor: string): string {
    // Implémentation simplifiée - utiliser une lib comme 'tinycolor2' en production
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
}