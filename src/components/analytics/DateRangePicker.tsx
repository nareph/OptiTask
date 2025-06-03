// src/components/analytics/DateRangePicker.tsx
"use client";

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

    return (
        <div className="flex gap-4">
            <div>
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                </label>
                <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
            </div>
            <div>
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                </label>
                <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    min={startDate}
                />
            </div>
        </div>
    );
}