// src/components/ui/Icons.tsx
import React from "react"; // N'oubliez pas cet import

// Interface de base pour les props d'icône
type IconProps = React.SVGProps<SVGSVGElement>

export const RefreshIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-4 h-4"} // Utilise la classe passée ou une valeur par défaut
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props} // Propage les autres props SVG
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2M15 15h-4.581"></path>
    </svg>
);

export const PlusIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
    </svg>
);

export const EditIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
    </svg>
);

export const DeleteIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

export const CloseIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-5 h-5"} // Note: celle-ci avait w-5 h-5 par défaut
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
    </svg>
);

export const PlayIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-4 h-4"} // J'ai gardé w-4 h-4 comme vos autres icônes, ajustez si PlayIcon doit être plus grande
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

export const PauseIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

export const StopIcon = ({ className, ...props }: IconProps) => (
    <svg
        className={className || "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
    </svg>
);