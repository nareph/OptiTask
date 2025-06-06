// src/components/timer/TimerDisplay.tsx
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

interface TimerDisplayProps {
    time: number;
    mode: 'pomodoro' | 'custom';
    currentSessionType?: 'work' | 'shortBreak' | 'longBreak';
    onModeChange: (mode: 'pomodoro' | 'custom') => void;
    isTimerActive: boolean;
}

export const TimerDisplay = ({
    time,
    mode,
    currentSessionType,
    onModeChange,
    isTimerActive
}: TimerDisplayProps) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    const formatTime = (value: number) => value.toString().padStart(2, '0');

    let sessionLabel = "";
    let subMessage = "";
    let sessionVariant: "default" | "secondary" | "destructive" | "outline" = "default";

    if (mode === 'pomodoro' && currentSessionType) {
        if (currentSessionType === 'work') {
            sessionLabel = "Work Session";
            subMessage = "Time to focus!";
            sessionVariant = "default";
        } else if (currentSessionType === 'shortBreak') {
            sessionLabel = "Short Break";
            subMessage = "Take a quick breather.";
            sessionVariant = "secondary";
        } else if (currentSessionType === 'longBreak') {
            sessionLabel = "Long Break";
            subMessage = "Time for a longer rest.";
            sessionVariant = "secondary";
        }
    } else if (mode === 'custom') {
        sessionLabel = "Custom Timer";
        sessionVariant = "outline";
    }

    const getTimeColor = () => {
        if (mode === 'pomodoro' && currentSessionType === 'work') return 'text-blue-600';
        if (mode === 'pomodoro' && (currentSessionType === 'shortBreak' || currentSessionType === 'longBreak')) return 'text-green-600';
        return 'text-foreground';
    };

    return (
        <div className="text-center space-y-4">
            <div className="flex justify-center gap-2">
                <Button
                    variant={mode === 'pomodoro' ? 'default' : 'outline'}
                    onClick={() => onModeChange('pomodoro')}
                    size="sm"
                    disabled={isTimerActive && mode !== 'pomodoro'}
                    className={cn(
                        "transition-all duration-200",
                        isTimerActive && mode !== 'pomodoro' && "opacity-50 cursor-not-allowed"
                    )}
                >
                    🍅 Pomodoro
                </Button>
                <Button
                    variant={mode === 'custom' ? 'default' : 'outline'}
                    onClick={() => onModeChange('custom')}
                    size="sm"
                    disabled={isTimerActive && mode !== 'custom'}
                    className={cn(
                        "transition-all duration-200",
                        isTimerActive && mode !== 'custom' && "opacity-50 cursor-not-allowed"
                    )}
                >
                    ⏱️ Custom
                </Button>
            </div>

            {sessionLabel && (
                <div className="space-y-2">
                    <Badge variant={sessionVariant} className="text-sm px-3 py-1">
                        {sessionLabel}
                    </Badge>
                    {subMessage && (
                        <p className="text-xs text-muted-foreground">{subMessage}</p>
                    )}
                </div>
            )}

            <div className={cn(
                "text-6xl font-mono font-bold transition-colors duration-200",
                getTimeColor()
            )}>
                {formatTime(minutes)}:{formatTime(seconds)}
            </div>
        </div>
    );
};
