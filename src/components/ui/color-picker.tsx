// src/components/ui/color-picker.tsx
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PREDEFINED_COLORS } from "@/utils/colors";

interface ColorPickerProps {
    selectedColor: string | null;
    onColorChange: (color: string | null) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {PREDEFINED_COLORS.map((color) => (
                <Button
                    key={color.value}
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                        "rounded-full w-8 h-8 p-0",
                        selectedColor === color.value && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => onColorChange(color.value)}
                />
            ))}
            <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                    "rounded-full w-8 h-8 p-0",
                    selectedColor === null && "ring-2 ring-offset-2 ring-primary"
                )}
                onClick={() => onColorChange(null)}
            >
                ✕
            </Button>
        </div>
    );
}