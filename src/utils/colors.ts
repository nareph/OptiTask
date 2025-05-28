// src/utils/colors.ts

export interface ColorOption {
    name: string;
    value: string; // Hex code
}

export const PREDEFINED_COLORS: ColorOption[] = [
    { name: "Red", value: "#EF4444" },
    { name: "Orange", value: "#F97316" },
    { name: "Amber", value: "#F59E0B" },
    { name: "Yellow", value: "#EAB308" },
    { name: "Lime", value: "#84CC16" },
    { name: "Green", value: "#22C55E" },
    { name: "Emerald", value: "#10B981" },
    { name: "Teal", value: "#14B8A6" },
    { name: "Cyan", value: "#06B6D4" },
    { name: "Sky", value: "#0EA5E9" },
    { name: "Blue", value: "#3B82F6" }, // Index 10
    { name: "Indigo", value: "#6366F1" },
    { name: "Violet", value: "#8B5CF6" },
    { name: "Purple", value: "#A855F7" },
    { name: "Fuchsia", value: "#D946EF" },
    { name: "Pink", value: "#EC4899" },
    { name: "Rose", value: "#F43F5E" },
    { name: "Gray", value: "#6B7280" },
    // Ajoutez d'autres couleurs si vous le souhaitez
];

// Vous pouvez aussi définir une couleur par défaut ici si vous le souhaitez
export const DEFAULT_COLOR_VALUE: string | null = PREDEFINED_COLORS[10].value; // Bleu
export const DEFAULT_NO_COLOR_VALUE: null = null;

// Une fonction helper si vous avez besoin de trouver une couleur par sa valeur
export const findColorOptionByValue = (value: string | null): ColorOption | undefined => {
    if (!value) return undefined;
    return PREDEFINED_COLORS.find(color => color.value === value);
};