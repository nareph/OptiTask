// src/components/analytics/DateRangePicker.tsx
"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";

interface DateRangePickerProps {
    onDateRangeChange: (dates: { startDate?: string; endDate?: string }) => void;
    initialStartDate?: string;
    initialEndDate?: string;
}

export default function DateRangePicker({
    onDateRangeChange,
    initialStartDate,
    initialEndDate,
}: DateRangePickerProps) {
    const [startDate, setStartDate] = useState<string>(initialStartDate || "");
    const [endDate, setEndDate] = useState<string>(initialEndDate || "");

    useEffect(() => {
        onDateRangeChange({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });
    }, [startDate, endDate, onDateRangeChange]);

    // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Calculer la date il y a 30 jours comme suggestion
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const defaultStartDate = thirtyDaysAgo.toISOString().split('T')[0];

    return (
        <Card className="p-4 border-dashed">
            <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Custom Date Range</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm font-medium">
                        Start Date
                    </Label>
                    <Input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={endDate || today}
                        placeholder={defaultStartDate}
                        className="w-full sm:w-40"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm font-medium">
                        End Date
                    </Label>
                    <Input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate}
                        max={today}
                        placeholder={today}
                        className="w-full sm:w-40"
                    />
                </div>
            </div>

            {startDate && endDate && (
                <div className="mt-3 p-2 bg-muted/50 rounded-md">
                    <p className="text-xs text-muted-foreground">
                        Selected range: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                        ({Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days)
                    </p>
                </div>
            )}

            {(!startDate || !endDate) && (
                <div className="mt-3 p-2 bg-muted/30 rounded-md">
                    <p className="text-xs text-muted-foreground">
                        Please select both start and end dates for custom range analysis
                    </p>
                </div>
            )}
        </Card>
    );
}