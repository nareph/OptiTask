// src/components/timer/TimerControls.tsx
import { Pause, Play, RotateCcw, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface TimerControlsProps {
    isActive: boolean;
    isPaused: boolean;
    onStart: () => void;
    onPause: () => void;
    onStop: () => void;
    onReset: () => void;
    disabled?: boolean;
}

export const TimerControls = ({
    isActive,
    isPaused,
    onStart,
    onPause,
    onStop,
    onReset,
    disabled = false,
}: TimerControlsProps) => {
    return (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {!isActive ? (
                <Button
                    onClick={onStart}
                    variant="default"
                    size="lg"
                    disabled={disabled}
                    className={cn(
                        "flex-grow sm:flex-grow-0 transition-all duration-200",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Play className="mr-1 sm:mr-2 h-4 w-4" />
                    Start
                </Button>
            ) : (
                <>
                    <Button
                        onClick={onPause}
                        variant="secondary"
                        size="lg"
                        className="flex-grow sm:flex-grow-0"
                    >
                        {isPaused ? (
                            <>
                                <Play className="mr-1 sm:mr-2 h-4 w-4" />
                                Resume
                            </>
                        ) : (
                            <>
                                <Pause className="mr-1 sm:mr-2 h-4 w-4" />
                                Pause
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onStop}
                        variant="destructive"
                        size="lg"
                        className="flex-grow sm:flex-grow-0"
                    >
                        <Square className="mr-1 sm:mr-2 h-4 w-4" />
                        Stop
                    </Button>
                    <Button
                        onClick={onReset}
                        variant="outline"
                        size="lg"
                        className="flex-grow sm:flex-grow-0"
                    >
                        <RotateCcw className="mr-1 sm:mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </>
            )}
        </div>
    );
};