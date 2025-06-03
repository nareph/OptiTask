// src/components/timer/TimeEntriesList.tsx
import { TaskWithLabels, TimeEntry } from '@/services/types';
import { format } from 'date-fns'; // Assurez-vous d'avoir installé date-fns: pnpm add date-fns
import { DeleteIcon } from '../ui/Icons'; // Assurez-vous que ce chemin est correct

interface TimeEntriesListProps {
    entries: TimeEntry[];
    tasks: TaskWithLabels[];
    onDelete: (entryId: string) => void;
    isLoading?: boolean; // Ajout de la prop isLoading (optionnelle)
}

export const TimeEntriesList = ({ entries, tasks, onDelete, isLoading = false }: TimeEntriesListProps) => {
    if (isLoading) {
        return (
            <div className="text-center py-4">
                <p className="text-gray-500 animate-pulse">Loading time entries...</p>
                {/* Vous pouvez ajouter un spinner ici */}
            </div>
        );
    }

    if (entries.length === 0) {
        return <p className="text-sm text-gray-500 text-center py-4 italic">No time entries recorded yet.</p>;
    }

    return (
        <div className="space-y-3 max-h-60 sm:max-h-72 overflow-y-auto pr-2"> {/* Augmenté max-h et ajouté pr-2 pour la scrollbar */}
            {entries.map((entry) => {
                const task = tasks.find(t => t.id === entry.task_id);
                const startDate = new Date(entry.start_time);
                // end_time peut être null si le timer est en cours (bien que nous sauvegardions à la fin)
                const endDate = entry.end_time ? new Date(entry.end_time) : null;

                // Calculer la durée. Si end_time est null, la durée est "en cours" ou 0.
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
                } else if (entry.duration_seconds && entry.duration_seconds > 0) { // Utiliser duration_seconds si disponible et end_time pas encore
                    const durMinutes = Math.floor(entry.duration_seconds / 60);
                    const durSeconds = entry.duration_seconds % 60;
                    durationDisplay = `${durMinutes}m ${durSeconds}s (saved)`;
                }


                return (
                    <div key={entry.id} className="p-2.5 border rounded-md flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div>
                            <div className="font-medium text-sm text-gray-700">
                                {task?.title || <span className="italic text-gray-500">Task not found or unassigned</span>}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                                {format(startDate, 'MMM d, HH:mm')}
                                {endDate && ` - ${format(endDate, 'HH:mm')}`}
                                <span className="mx-1.5">•</span>
                                {durationDisplay}
                                {entry.is_pomodoro_session && <span className="ml-2 text-xs font-semibold text-orange-500">(P)</span>}
                            </div>
                        </div>
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100"
                            title="Delete entry"
                        >
                            <DeleteIcon />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};