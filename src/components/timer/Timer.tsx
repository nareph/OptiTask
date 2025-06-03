// src/components/timer/Timer.tsx
'use client';

import { isApiError } from "@/services/common";
import { createTimeEntry, deleteTimeEntry, fetchTimeEntries } from "@/services/timeEntryApi";
import { CreateTimeEntryPayload, Project, TaskWithLabels, TimeEntry } from "@/services/types";
import { notify } from "@/utils/notifications";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { TaskSelector } from "./TaskSelector";
import { TimeEntriesList } from "./TimeEntriesList";
import { TimerControls } from "./TimerControls";
import { TimerDisplay } from "./TimerDisplay";


interface TimerProps {
    tasks: TaskWithLabels[];
    projectsForForms: Project[];
    onDataChanged?: () => void;
}

export const Timer = ({ tasks, projectsForForms, onDataChanged }: TimerProps) => {
    const { data: session } = useSession();

    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(true);

    const [mode, setMode] = useState<'pomodoro' | 'custom'>('pomodoro');
    const [timerSessionType, setTimerSessionType] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
    const [pomodoroCount, setPomodoroCount] = useState(0);

    const WORK_DURATION = 25 * 60;
    const SHORT_BREAK_DURATION = 5 * 60;
    const LONG_BREAK_DURATION = 15 * 60;
    const POMODOROS_PER_LONG_BREAK = 4;

    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [currentSessionStartTime, setCurrentSessionStartTime] = useState<Date | null>(null);

    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [isLoadingEntries, setIsLoadingEntries] = useState(false);

    //const isCurrentlyRunning = isActive && !isPaused;
    const audioRef = useRef<HTMLAudioElement | null>(null); // Pour gérer l'audio

    useEffect(() => { // Précharger l'audio
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio(); // Créer une seule instance
        }
    }, []);

    const playSound = useCallback((soundPath: string) => {
        if (audioRef.current) {
            audioRef.current.src = soundPath;
            audioRef.current.play().catch(e => console.warn("Audio play error:", e));
        }
    }, []);


    const loadTimeEntries = useCallback(async () => {
        if (!session) return;
        console.log("Timer: loadTimeEntries called (fetching all recent for user)"); // Message de log mis à jour
        setIsLoadingEntries(true);

        const result = await fetchTimeEntries(session, {});
        if (isApiError(result)) {
            console.error('Timer: Failed to load time entries:', result.message);
            notify('Failed to load time entries', { type: 'error' });
            setEntries([]);
        } else {
            setEntries(result);
        }
        setIsLoadingEntries(false);
    }, [session]);

    useEffect(() => {
        if (session) loadTimeEntries();
    }, [loadTimeEntries, session]);

    useEffect(() => {
        if (session) loadTimeEntries();
    }, [loadTimeEntries, session]);


    // Appelée à la fin d'une session (timer à 0 ou clic sur Stop)
    const completeAndSaveCurrentSession = useCallback(async (sessionNaturallyCompleted: boolean) => {
        console.log("Timer: completeAndSaveCurrentSession. NaturallyCompleted:", sessionNaturallyCompleted, "Mode:", mode, "SessionType:", timerSessionType);
        setIsActive(false);
        setIsPaused(true);

        // Sauvegarder la session de travail (Pomodoro ou Custom)
        if (timerSessionType === 'work' && currentSessionStartTime && selectedTaskId) {
            const endTime = new Date();
            const duration = Math.floor((endTime.getTime() - currentSessionStartTime.getTime()) / 1000);

            if (duration > 0) {
                const payload: CreateTimeEntryPayload = {
                    task_id: selectedTaskId,
                    start_time: currentSessionStartTime.toISOString(),
                    end_time: endTime.toISOString(),
                    duration_seconds: duration,
                    is_pomodoro_session: mode === 'pomodoro',
                };
                const result = await createTimeEntry(session!, payload);
                if (isApiError(result)) {
                    notify('Failed to save time entry', { type: 'error' });
                } else {
                    // Le message dépend si c'est une complétion naturelle de Pomodoro ou un arrêt manuel/custom.
                    let successMessage = 'Time entry saved!';
                    if (mode === 'pomodoro' && sessionNaturallyCompleted) {
                        successMessage = 'Pomodoro work session completed & saved!';
                    }
                    notify(successMessage, { type: 'success' });
                    loadTimeEntries();
                    if (onDataChanged) onDataChanged();
                }
            } else {
                notify('Session too short, not recorded.', { type: 'info' });
            }
        }
        setCurrentSessionStartTime(null); // Prêt pour la prochaine session de travail

        // Logique de transition Pomodoro
        if (mode === 'pomodoro' && timerSessionType === 'work' && sessionNaturallyCompleted) {
            const newPomodoroCount = pomodoroCount + 1;
            setPomodoroCount(newPomodoroCount);
            playSound('/sounds/complete.mp3');

            if (newPomodoroCount % POMODOROS_PER_LONG_BREAK === 0) {
                setTimerSessionType('longBreak'); setTime(LONG_BREAK_DURATION);
                notify("Time for a long break! 🎉", { type: "info", duration: 5000 });
            } else {
                setTimerSessionType('shortBreak'); setTime(SHORT_BREAK_DURATION);
                notify("Time for a short break! 👍", { type: "info", duration: 5000 });
            }
            // Optionnel: Auto-start break
            // setIsActive(true); setIsPaused(false); setCurrentSessionStartTime(new Date()); // Note: break n'a pas de startTime pour la tâche
        } else {
            // Pour Custom mode après un stop, ou si un Pomodoro work est stoppé manuellement,
            // ou après une pause, on réinitialise pour une nouvelle session de travail.
            setTimerSessionType('work');
            if (mode === 'pomodoro') setTime(WORK_DURATION); else setTime(0);
        }

    }, [session, currentSessionStartTime, selectedTaskId, mode, timerSessionType, pomodoroCount, onDataChanged, loadTimeEntries, WORK_DURATION, SHORT_BREAK_DURATION, LONG_BREAK_DURATION, POMODOROS_PER_LONG_BREAK, playSound]);


    const handleStartClick = () => {
        console.log("Timer: handleStartClick. Mode:", mode, "SessionType:", timerSessionType, "IsActive:", isActive, "IsPaused:", isPaused);

        // Pour une session de travail (Pomodoro ou Custom), une tâche doit être sélectionnée
        if (timerSessionType === 'work' && !selectedTaskId) {
            notify(`Please select a task to start a ${mode === 'pomodoro' ? 'Pomodoro' : 'Custom'} work session.`, { type: "warning" });
            return;
        }

        if (isActive && !isPaused) { // Si le timer tourne déjà
            notify("Timer is already running.", { type: "info" }); return;
        }

        setIsActive(true);
        setIsPaused(false);
        // Si on reprend une session après pause OU si on démarre une nouvelle session, on met à jour/définit startTime
        // Si currentSessionStartTime est déjà défini (on était en pause), on le garde.
        // Sinon (nouvelle session), on le définit.
        if (!currentSessionStartTime || isPaused) {
            setCurrentSessionStartTime(prevStartTime => prevStartTime && isPaused ? prevStartTime : new Date());
        }

        let startMessage = "Timer started!";
        if (mode === 'pomodoro') {
            if (timerSessionType === 'work') startMessage = "Pomodoro work session started!";
            else if (timerSessionType === 'shortBreak') startMessage = "Short break started.";
            else if (timerSessionType === 'longBreak') startMessage = "Long break started.";
        } else { // Custom mode
            startMessage = "Custom timer started!";
            // Si c'est le début d'un custom, time devrait être 0.
            // Si on avait un custom avec durée (non implémenté), time serait > 0.
        }
        notify(startMessage, { type: 'success' });
    };

    const handlePauseToggleClick = () => {
        if (!isActive) return; // Ne rien faire si le timer n'a pas été démarré
        setIsPaused(!isPaused);
        notify(isPaused ? 'Timer paused' : 'Timer resumed');
    };

    const handleStopClick = () => {
        console.log("Timer: handleStopClick. IsActive:", isActive, "Mode:", mode, "SessionType:", timerSessionType);
        if (isActive) {
            // En mode Custom, cliquer sur "Stop" *est* la complétion.
            // En mode Pomodoro (travail ou pause), c'est un arrêt manuel.
            const isPomodoroWorkNaturallyCompleted = (mode === 'pomodoro' && timerSessionType === 'work' && time <= 1); // Si le timer pomodoro était à la fin
            const isConsideredComplete = (mode === 'custom' && timerSessionType === 'work') || isPomodoroWorkNaturallyCompleted;

            completeAndSaveCurrentSession(isConsideredComplete);
        }
    };

    const handleResetClick = () => {
        console.log("Timer: handleResetClick.");
        if (isActive && currentSessionStartTime && timerSessionType === 'work' && selectedTaskId) {
            if (window.confirm("Active work session. Save before resetting?")) {
                completeAndSaveCurrentSession(false); // false car reset manuel
            }
        }
        setIsActive(false);
        setIsPaused(true);
        setTimerSessionType('work');
        if (mode === 'pomodoro') setTime(WORK_DURATION); else setTime(0);
        setCurrentSessionStartTime(null);
        setPomodoroCount(0);
        notify('Timer reset');
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (isActive && !isPaused) {
            console.log("Timer: useEffect - Tick. Mode:", mode, "SessionType:", timerSessionType, "Time:", time);

            // Logique de compte à rebours (Pomodoro ou Custom avec durée initiale > 0)
            if (mode === 'pomodoro' || (mode === 'custom' && time > 0 && !currentSessionStartTime) /* Cas d'un custom countdown */) {
                intervalId = setInterval(() => {
                    setTime((prevTime) => {
                        if (prevTime <= 1) { // Timer atteint 0
                            clearInterval(intervalId!);
                            if (timerSessionType === 'work') { // Session de travail (Pomodoro ou Custom countdown)
                                completeAndSaveCurrentSession(true); // true = complété naturellement
                            } else { // C'était une pause Pomodoro
                                console.log(`Timer: ${timerSessionType} finished.`);
                                notify(`${timerSessionType === 'shortBreak' ? 'Short' : 'Long'} break finished! Time for work.`, { type: "info" });
                                playSound('/sounds/complete.mp3');
                                setTimerSessionType('work');
                                setTime(WORK_DURATION);
                                setIsActive(false); setIsPaused(true); // Attendre que l'utilisateur démarre
                            }
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }, 1000);
            }
            // Logique de chronomètre (Custom, démarre de 0 et compte en montant)
            else if (mode === 'custom' && currentSessionStartTime) {
                // Assurer que le temps est à jour au démarrage/reprise du chronomètre
                const elapsed = Math.max(0, Math.floor((new Date().getTime() - currentSessionStartTime.getTime()) / 1000));
                if (time !== elapsed) setTime(elapsed); // Synchroniser si décalage (ex: après une pause)

                intervalId = setInterval(() => {
                    if (currentSessionStartTime && isActive && !isPaused) {
                        setTime(Math.max(0, Math.floor((new Date().getTime() - currentSessionStartTime.getTime()) / 1000)));
                    } else {
                        if (intervalId) clearInterval(intervalId);
                    }
                }, 1000);
            }
        }
        return () => { if (intervalId) clearInterval(intervalId); };
    }, [isActive, isPaused, mode, timerSessionType, time, currentSessionStartTime, completeAndSaveCurrentSession, WORK_DURATION, playSound]); // Ajout de `time` et `playSound`

    const deleteEntry = useCallback(async (entryId: string) => {
        if (!session) return;
        const result = await deleteTimeEntry(session, entryId);
        if (isApiError(result)) {
            console.error('Timer: Failed to delete entry:', result.message);
            notify('Failed to delete entry', { type: 'error' });
        } else {
            notify('Entry deleted', { type: 'success' });
            loadTimeEntries(); // Recharger la liste des entrées
            if (onDataChanged) onDataChanged();
        }
    }, [session, loadTimeEntries, onDataChanged]);

    // --- AFFICHAGE ---
    return (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-6">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <div className="flex-1 space-y-4 md:border-r md:pr-6">
                    <TimerDisplay
                        time={time}
                        mode={mode}
                        currentSessionType={timerSessionType}
                        onModeChange={(newMode) => {
                            if (mode === newMode) return;
                            if (isActive) {
                                if (window.confirm(`A timer session is active. Changing mode will stop the current session. Continue?`)) {
                                    if (timerSessionType === 'work' && currentSessionStartTime && selectedTaskId) {
                                        completeAndSaveCurrentSession(false); // Sauvegarder si c'était du travail
                                    } else { // Si c'était une pause ou un custom non démarré avec start time, juste reset.
                                        handleResetClick(); // Réinitialise proprement
                                    }
                                } else {
                                    return;
                                }
                            }
                            setMode(newMode);
                            setTimerSessionType('work');
                            if (newMode === 'pomodoro') setTime(WORK_DURATION); else setTime(0);
                            setIsActive(false); setIsPaused(true); setCurrentSessionStartTime(null);
                        }}
                        isTimerActive={isActive} // On passe juste si le timer est actif ou non
                    />
                    {/* Afficher le sélecteur de tâche uniquement si c'est une session de travail */}
                    {timerSessionType === 'work' ? (
                        <TaskSelector
                            tasks={tasks}
                            projects={projectsForForms}
                            selectedTaskId={selectedTaskId}
                            onSelectTask={setSelectedTaskId}
                            disabled={isActive && !isPaused} // Désactiver si le timer tourne
                        />
                    ) : (
                        <div className="h-10 flex items-center justify-center text-sm text-gray-500 italic">
                            Taking a break...
                        </div>
                    )}
                    <TimerControls
                        isActive={isActive}
                        isPaused={isPaused}
                        onStart={handleStartClick}
                        onPause={handlePauseToggleClick}
                        onStop={handleStopClick}
                        onReset={handleResetClick}
                    // Le bouton Start est désactivé si (c'est une session de travail ET pas de tâche sélectionnée) OU si le timer tourne déjà sans être en pause
                    // isStartDisabled={(timerSessionType === 'work' && !selectedTaskId) || (isActive && !isPaused)}
                    />
                </div>

                <div className="flex-1 md:pl-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Recent Time Entries</h3>
                    <TimeEntriesList
                        entries={entries}
                        onDelete={deleteEntry}
                        tasks={tasks}
                        isLoading={isLoadingEntries}
                    />
                </div>
            </div>

            {mode === 'pomodoro' && (
                <div className="text-center text-sm text-gray-600 pt-4 border-t">
                    Pomodoros this cycle: <span className="font-semibold">{pomodoroCount % POMODOROS_PER_LONG_BREAK}</span> / {POMODOROS_PER_LONG_BREAK}
                    <span className="mx-2">|</span>
                    Total completed: <span className="font-semibold">{pomodoroCount}</span>
                </div>
            )}
        </div>
    );
};