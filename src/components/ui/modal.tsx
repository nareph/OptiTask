// src/components/ui/modal.tsx
"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import * as React from "react"

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
    showCloseButton?: boolean
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}: ModalProps) {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-[95vw]'
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={cn(
                    sizeClasses[size],
                    "overflow-hidden p-0"
                )}
                onInteractOutside={(e: { preventDefault: () => unknown }) => e.preventDefault()} // Empêche la fermeture au clic extérieur
            >
                {/* Header */}
                <DialogHeader className="border-b p-4">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-semibold">
                            {title}
                        </DialogTitle>

                    </div>
                </DialogHeader>

                {/* Contenu */}
                <div className="overflow-y-auto max-h-[70vh] p-4">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    )
}