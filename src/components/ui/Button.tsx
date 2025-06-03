// src/components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import React, { ButtonHTMLAttributes } from 'react';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    {
        variants: {
            variant: {
                primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
                secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
                danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
                outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-400',
                ghost: 'hover:bg-gray-100 text-gray-700 focus:ring-gray-400',
                link: 'text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500',
            },
            size: {
                default: 'px-4 py-2',
                sm: 'px-3 py-1.5 text-xs',
                lg: 'px-6 py-3 text-lg',
                icon: 'h-9 w-9',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    // asChild?: boolean; // Supprimé des props
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    // ({ className, variant, size, asChild = false, ...props }, ref) => { // Ancienne ligne
    ({ className, variant, size, ...props }, ref) => { // `asChild` supprimé de la déstructuration
        const Comp = 'button'; // Toujours un bouton pour l'instant

        return (
            <Comp
                className={clsx(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
