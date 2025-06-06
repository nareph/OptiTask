// src/components/timer/Timer.tsx
'use client';

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    onPomodoroStateChange: (isActive: boolean) => void;
}

export const Timer = ({ tasks, projectsForForms, onDataChanged, onPomodoroStateChange }: TimerProps) => {
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

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();
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
        console.log("Timer: loadTimeEntries called (fetching all recent for user)");
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

    const completeAndSaveCurrentSession = useCallback(async (sessionNaturallyCompleted: boolean) => {
        console.log("Timer: completeAndSaveCurrentSession. NaturallyCompleted:", sessionNaturallyCompleted, "Mode:", mode, "SessionType:", timerSessionType);
        setIsActive(false);
        setIsPaused(true);

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
        setCurrentSessionStartTime(null);

        if (mode === 'pomodoro' && timerSessionType === 'work' && sessionNaturallyCompleted) {
            const newPomodoroCount = pomodoroCount + 1;
            setPomodoroCount(newPomodoroCount);
            playSound('/sounds/complete.mp3');

            if (newPomodoroCount % POMODOROS_PER_LONG_BREAK === 0) {
                setTimerSessionType('longBreak');
                setTime(LONG_BREAK_DURATION);
                notify("Time for a long break! 🎉", { type: "info", duration: 5000 });
            } else {
                setTimerSessionType('shortBreak');
                setTime(SHORT_BREAK_DURATION);
                notify("Time for a short break! 👍", { type: "info", duration: 5000 });
            }
        } else {
            setTimerSessionType('work');
            if (mode === 'pomodoro') setTime(WORK_DURATION); else setTime(0);
        }

    }, [mode, timerSessionType, currentSessionStartTime, selectedTaskId, session, loadTimeEntries, onDataChanged, pomodoroCount, playSound, LONG_BREAK_DURATION, SHORT_BREAK_DURATION, WORK_DURATION]);

    const handleStartClick = () => {
        console.log("Timer: handleStartClick. Mode:", mode, "SessionType:", timerSessionType, "IsActive:", isActive, "IsPaused:", isPaused);

        if (timerSessionType === 'work' && !selectedTaskId) {
            notify(`Please select a task to start a ${mode === 'pomodoro' ? 'Pomodoro' : 'Custom'} work session.`, { type: "warning" });
            return;
        }

        if (isActive && !isPaused) {
            notify("Timer is already running.", { type: "info" });
            return;
        }

        setIsActive(true);
        setIsPaused(false);

        if (!currentSessionStartTime || isPaused) {
            setCurrentSessionStartTime(prevStartTime => prevStartTime && isPaused ? prevStartTime : new Date());
        }

        let startMessage = "Timer started!";
        if (mode === 'pomodoro') {
            if (timerSessionType === 'work') startMessage = "Pomodoro work session started!";
            else if (timerSessionType === 'shortBreak') startMessage = "Short break started.";
            else if (timerSessionType === 'longBreak') startMessage = "Long break started.";
        } else {
            startMessage = "Custom timer started!";
        }
        onPomodoroStateChange(true);
        notify(startMessage, { type: 'success' });
    };

    const handlePauseToggleClick = () => {
        if (!isActive) return;
        setIsPaused(!isPaused);
        notify(isPaused ? 'Timer paused' : 'Timer resumed');
    };

    const handleStopClick = () => {
        console.log("Timer: handleStopClick. IsActive:", isActive, "Mode:", mode, "SessionType:", timerSessionType);
        if (isActive) {
            const isPomodoroWorkNaturallyCompleted = (mode === 'pomodoro' && timerSessionType === 'work' && time <= 1);
            const isConsideredComplete = (mode === 'custom' && timerSessionType === 'work') || isPomodoroWorkNaturallyCompleted;
            completeAndSaveCurrentSession(isConsideredComplete);
            onPomodoroStateChange(false);
        }
    };

    const handleResetClick = () => {
        console.log("Timer: handleResetClick.");
        if (isActive && currentSessionStartTime && timerSessionType === 'work' && selectedTaskId) {
            if (window.confirm("Active work session. Save before resetting?")) {
                completeAndSaveCurrentSession(false);
            }
        }
        setIsActive(false);
        setIsPaused(true);
        setTimerSessionType('work');
        if (mode === 'pomodoro') setTime(WORK_DURATION); else setTime(0);
        setCurrentSessionStartTime(null);
        setPomodoroCount(0);
        onPomodoroStateChange(false);
        notify('Timer reset');
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (isActive && !isPaused) {
            console.log("Timer: useEffect - Tick. Mode:", mode, "SessionType:", timerSessionType, "Time:", time);

            if (mode === 'pomodoro' || (mode === 'custom' && time > 0 && !currentSessionStartTime)) {
                intervalId = setInterval(() => {
                    setTime((prevTime) => {
                        if (prevTime <= 1) {
                            clearInterval(intervalId!);
                            if (timerSessionType === 'work') {
                                completeAndSaveCurrentSession(true);
                            } else {
                                console.log(`Timer: ${timerSessionType} finished.`);
                                notify(`${timerSessionType === 'shortBreak' ? 'Short' : 'Long'} break finished! Time for work.`, { type: "info" });
                                playSound('/sounds/complete.mp3');
                                setTimerSessionType('work');
                                setTime(WORK_DURATION);
                                setIsActive(false);
                                setIsPaused(true);
                                onPomodoroStateChange(false);
                            }
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }, 1000);
            }
            else if (mode === 'custom' && currentSessionStartTime) {
                const elapsed = Math.max(0, Math.floor((new Date().getTime() - currentSessionStartTime.getTime()) / 1000));
                if (time !== elapsed) setTime(elapsed);

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
    }, [isActive, isPaused, mode, timerSessionType, time, currentSessionStartTime, completeAndSaveCurrentSession, WORK_DURATION, playSound, onPomodoroStateChange]);

    const deleteEntry = useCallback(async (entryId: string) => {
        if (!session) return;
        const result = await deleteTimeEntry(session, entryId);
        if (isApiError(result)) {
            console.error('Timer: Failed to delete entry:', result.message);
            notify('Failed to delete entry', { type: 'error' });
        } else {
            notify('Entry deleted', { type: 'success' });
            loadTimeEntries();
            if (onDataChanged) onDataChanged();
        }
    }, [session, loadTimeEntries, onDataChanged]);

    return (
        <Card className="w-full">
            <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                    <div className="flex-1 space-y-4 lg:border-r lg:pr-6">
                        <TimerDisplay
                            time={time}
                            mode={mode}
                            currentSessionType={timerSessionType}
                            onModeChange={(newMode) => {
                                if (mode === newMode) return;
                                if (isActive) {
                                    if (window.confirm(`A timer session is active. Changing mode will stop the current session. Continue?`)) {
                                        if (timerSessionType === 'work' && currentSessionStartTime && selectedTaskId) {
                                            completeAndSaveCurrentSession(false);
                                        } else {
                                            handleResetClick();
                                        }
                                    } else {
                                        return;
                                    }
                                }
                                setMode(newMode);
                                setTimerSessionType('work');
                                if (newMode === 'pomodoro') setTime(WORK_DURATION); else setTime(0);
                                setIsActive(false);
                                setIsPaused(true);
                                setCurrentSessionStartTime(null);
                            }}
                            isTimerActive={isActive}
                        />

                        {timerSessionType === 'work' ? (
                            <TaskSelector
                                tasks={tasks}
                                projects={projectsForForms}
                                selectedTaskId={selectedTaskId}
                                onSelectTask={setSelectedTaskId}
                                disabled={isActive && !isPaused}
                            />
                        ) : (
                            <div className="h-10 flex items-center justify-center">
                                <Badge variant="secondary" className="text-sm">
                                    Taking a break...
                                </Badge>
                            </div>
                        )}

                        <TimerControls
                            isActive={isActive}
                            isPaused={isPaused}
                            onStart={handleStartClick}
                            onPause={handlePauseToggleClick}
                            onStop={handleStopClick}
                            onReset={handleResetClick}
                            disabled={(timerSessionType === 'work' && !selectedTaskId) || (isActive && !isPaused)}
                        />
                    </div>

                    <Separator orientation="vertical" className="hidden lg:block" />

                    <div className="flex-1 lg:pl-6">
                        <h3 className="text-lg font-semibold mb-3 text-foreground">Recent Time Entries</h3>
                        <TimeEntriesList
                            entries={entries}
                            onDelete={deleteEntry}
                            tasks={tasks}
                            isLoading={isLoadingEntries}
                        />
                    </div>
                </div>

                {mode === 'pomodoro' && (
                    <>
                        <Separator />
                        <div className="text-center text-sm text-muted-foreground">
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span>Pomodoros this cycle:</span>
                                    <Badge variant="outline">
                                        {pomodoroCount % POMODOROS_PER_LONG_BREAK} / {POMODOROS_PER_LONG_BREAK}
                                    </Badge>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-2">
                                    <span>Total completed:</span>
                                    <Badge variant="default">
                                        {pomodoroCount}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};


