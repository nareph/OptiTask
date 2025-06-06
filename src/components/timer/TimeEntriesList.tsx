// src/components/timer/TimeEntriesList.tsx
import { TaskWithLabels, TimeEntry } from '@/services/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeEntriesListProps {
    entries: TimeEntry[];
    tasks: TaskWithLabels[];
    onDelete: (entryId: string) => void;
    isLoading?: boolean;
}

export const TimeEntriesList = ({ entries, tasks, onDelete, isLoading = false }: TimeEntriesListProps) => {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index}>
                        <CardContent className="p-3">
                            <div className="flex justify-between items-center">
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-8 w-8 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                        No time entries recorded yet.
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                        Start a timer to track your work!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <ScrollArea className="h-60 sm:h-72 w-full">
            <div className="space-y-2 pr-2">
                {entries.map((entry) => {
                    const task = tasks.find(t => t.id === entry.task_id);
                    const startDate = new Date(entry.start_time);
                    const endDate = entry.end_time ? new Date(entry.end_time) : null;

                    // Calculate duration display
                    let durationDisplay = "N/A";
                    if (endDate) {
                        const durationSeconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
                        if (durationSeconds > 0) {
                            const durMinutes = Math.floor(durationSeconds / 60);
                            const durSeconds = durationSeconds % 60;
                            durationDisplay = `${durMinutes}m ${durSeconds}s`;
                        } else {
                            durationDisplay = "< 1s";
                        }
                    } else if (entry.duration_seconds && entry.duration_seconds > 0) {
                        const durMinutes = Math.floor(entry.duration_seconds / 60);
                        const durSeconds = entry.duration_seconds % 60;
                        durationDisplay = `${durMinutes}m ${durSeconds}s`;
                    }

                    return (
                        <Card key={entry.id} className="transition-colors hover:bg-accent/50">
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-sm text-foreground truncate">
                                                {task?.title || (
                                                    <span className="italic text-muted-foreground">
                                                        Task not found
                                                    </span>
                                                )}
                                            </h4>
                                            {entry.is_pomodoro_session && (
                                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                                    🍅
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{format(startDate, 'MMM d, HH:mm')}</span>
                                            {endDate && (
                                                <>
                                                    <span>→</span>
                                                    <span>{format(endDate, 'HH:mm')}</span>
                                                </>
                                            )}
                                            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                                {durationDisplay}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onDelete(entry.id)}
                                        className={cn(
                                            "h-8 w-8 text-muted-foreground hover:text-destructive",
                                            "hover:bg-destructive/10 transition-colors"
                                        )}
                                        title="Delete entry"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </ScrollArea>
    );
};

