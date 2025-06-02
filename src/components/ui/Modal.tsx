import { useEffect } from 'react'
import { CloseIcon } from './Icons'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}: ModalProps) => {
    // Bloque le scroll quand le modal est ouvert
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            return () => {
                document.body.style.overflow = ''
            }
        }
    }, [isOpen])

    if (!isOpen) return null

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl'
    }

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={onClose} // Ferme quand on clique sur l'overlay
        >
            <div
                className={`w-full ${sizeClasses[size]} bg-white rounded-lg shadow-xl overflow-hidden animate-fadeIn`}
                onClick={(e) => e.stopPropagation()} // Empêche la fermeture quand on clique à l'intérieur
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b p-4">
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 p-1"
                        aria-label="Fermer"
                    >
                        <CloseIcon />
                    </button>
                </div>

                {/* Contenu */}
                <div className="p-4 overflow-y-auto max-h-[70vh]">
                    {children}
                </div>
            </div>
        </div>
    )
}