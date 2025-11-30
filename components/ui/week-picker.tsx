// components/ui/week-picker.tsx
"use client";

import * as React from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface WeekPickerProps {
    onWeekChange: (start: Date, end: Date) => void;
}

export function WeekPicker({ onWeekChange }: WeekPickerProps) {
    const [currentWeek, setCurrentWeek] = React.useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [selectedWeek, setSelectedWeek] = React.useState(currentWeek.toISOString());

    const generateWeeks = (baseDate: Date) => {
        const weeks = [];
        let date = subWeeks(baseDate, 4); // Start from 4 weeks ago
        for (let i = 0; i < 9; i++) { // Generate 9 weeks total
            const start = startOfWeek(date, { weekStartsOn: 1 });
            const end = endOfWeek(date, { weekStartsOn: 1 });
            weeks.push({
                value: start.toISOString(),
                label: `${format(start, "MMM dd")} - ${format(end, "MMM dd")}`,
                startDate: start,
                endDate: end,
            });
            date = addWeeks(date, 1);
        }
        return weeks;
    };

    const weekOptions = generateWeeks(currentWeek);

    const handleSelect = (value: string) => {
        setSelectedWeek(value);
        const selectedOption = weekOptions.find(w => w.value === value);
        if (selectedOption) {
            onWeekChange(selectedOption.startDate, selectedOption.endDate);
        }
    };

    const handlePrev = () => {
        const newWeek = subWeeks(currentWeek, 1);
        setCurrentWeek(newWeek);
        onWeekChange(startOfWeek(newWeek, { weekStartsOn: 1 }), endOfWeek(newWeek, { weekStartsOn: 1 }));
    };

    const handleNext = () => {
        const newWeek = addWeeks(currentWeek, 1);
        setCurrentWeek(newWeek);
        onWeekChange(startOfWeek(newWeek, { weekStartsOn: 1 }), endOfWeek(newWeek, { weekStartsOn: 1 }));
    };

    React.useEffect(() => {
        // Initial call to set the first week
        const start = startOfWeek(new Date(), { weekStartsOn: 1 });
        const end = endOfWeek(new Date(), { weekStartsOn: 1 });
        onWeekChange(start, end);
    }, [onWeekChange]);

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrev} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">
                            {weekOptions.find(w => w.value === selectedWeek)?.label || "Select a week"}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Select value={selectedWeek} onValueChange={handleSelect}>
                        <SelectTrigger className="hidden">
                            <SelectValue placeholder="Select a week" />
                        </SelectTrigger>
                        <SelectContent>
                            {weekOptions.map((week) => (
                                <SelectItem key={week.value} value={week.value}>
                                    {week.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </PopoverContent>
            </Popover>
            <Button variant="outline" size="icon" onClick={handleNext} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}