// src/components/timer/TimerControls.tsx
import { Button } from '../ui/Button'; // Assurez-vous que le chemin est correct
import { PauseIcon, PlayIcon, RefreshIcon, StopIcon } from '../ui/Icons'; // Assurez-vous que le chemin est correct

interface TimerControlsProps {
    isActive: boolean;
    isPaused: boolean;
    onStart: () => void; // Considérez Promise<void> si vos handlers sont async
    onPause: () => void;
    onStop: () => void;  // Considérez Promise<void>
    onReset: () => void;
    disabled?: boolean; // Ajout de la prop disabled, optionnelle
    // Ou plus spécifiquement :
    // isStartDisabled?: boolean;
}

export const TimerControls = ({
    isActive,
    isPaused,
    onStart,
    onPause,
    onStop,
    onReset,
    disabled = false, // Valeur par défaut pour disabled
}: TimerControlsProps) => {
    return (
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3"> {/* Ajout de flex-wrap */}
            {!isActive ? (
                <Button
                    onClick={onStart}
                    variant="primary"
                    size="lg"
                    disabled={disabled} // Utiliser la prop disabled ici
                    className="flex-grow sm:flex-grow-0" // Pour que le bouton prenne de la place sur petit écran
                >
                    <PlayIcon className="mr-1 sm:mr-2 h-5 w-5" /> {/* Ajuster taille icône */}
                    Start
                </Button>
            ) : (
                <>
                    <Button
                        onClick={onPause}
                        variant="secondary"
                        size="lg"
                        className="flex-grow sm:flex-grow-0"
                    // disabled n'est généralement pas appliqué au bouton Pause/Resume si le timer est actif
                    >
                        {isPaused ? (
                            <>
                                <PlayIcon className="mr-1 sm:mr-2 h-5 w-5" />
                                Resume
                            </>
                        ) : (
                            <>
                                <PauseIcon className="mr-1 sm:mr-2 h-5 w-5" />
                                Pause
                            </>
                        )}
                    </Button>
                    <Button
                        onClick={onStop}
                        variant="danger"
                        size="lg"
                        className="flex-grow sm:flex-grow-0"
                    // disabled n'est généralement pas appliqué au bouton Stop si le timer est actif
                    >
                        <StopIcon className="mr-1 sm:mr-2 h-5 w-5" />
                        Stop
                    </Button>
                    {/* Le bouton Reset pourrait aussi être conditionnellement désactivé,
              mais il est souvent toujours disponible. */}
                    <Button
                        onClick={onReset}
                        variant="outline"
                        size="lg"
                        className="flex-grow sm:flex-grow-0"
                    >
                        <RefreshIcon className="mr-1 sm:mr-2 h-5 w-5" />
                        Reset
                    </Button>
                </>
            )}
        </div>
    );
};