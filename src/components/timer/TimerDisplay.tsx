// src/components/timer/TimerDisplay.tsx

import { Button } from "../ui/Button"; // Assurez-vous que ce chemin est correct

interface TimerDisplayProps {
    time: number;
    mode: 'pomodoro' | 'custom';
    currentSessionType?: 'work' | 'shortBreak' | 'longBreak'; // Ajouté et optionnel
    onModeChange: (mode: 'pomodoro' | 'custom') => void;
    isTimerActive: boolean; // Ajouté pour désactiver les boutons de mode si le timer tourne
}

export const TimerDisplay = ({
    time,
    mode,
    currentSessionType,
    onModeChange,
    isTimerActive // Nouvelle prop
}: TimerDisplayProps) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    const formatTime = (value: number) => value.toString().padStart(2, '0');

    let sessionLabel = "";
    let subMessage = "";

    if (mode === 'pomodoro' && currentSessionType) {
        if (currentSessionType === 'work') {
            sessionLabel = "Work Session";
            subMessage = "Time to focus!";
        } else if (currentSessionType === 'shortBreak') {
            sessionLabel = "Short Break";
            subMessage = "Take a quick breather.";
        } else if (currentSessionType === 'longBreak') {
            sessionLabel = "Long Break";
            subMessage = "Time for a longer rest.";
        }
    } else if (mode === 'custom') {
        sessionLabel = "Custom Timer";
        // Pour le mode custom, si le timer tourne, on affiche "Tracking..."
        // Sinon, on peut afficher un message pour démarrer ou la durée si déjà configurée.
        // Pour l'instant, on laisse simple.
    }


    return (
        <div className="text-center space-y-3"> {/* Ajusté space-y */}
            <div className="flex justify-center gap-2">
                <Button
                    variant={mode === 'pomodoro' ? 'primary' : 'outline'}
                    onClick={() => onModeChange('pomodoro')}
                    size="sm"
                    disabled={isTimerActive && mode !== 'pomodoro'} // Désactiver si le timer est actif et qu'on n'est pas déjà dans ce mode
                    className={isTimerActive && mode !== 'pomodoro' ? "opacity-50 cursor-not-allowed" : ""}
                >
                    Pomodoro
                </Button>
                <Button
                    variant={mode === 'custom' ? 'primary' : 'outline'}
                    onClick={() => onModeChange('custom')}
                    size="sm"
                    disabled={isTimerActive && mode !== 'custom'} // Désactiver si le timer est actif et qu'on n'est pas déjà dans ce mode
                    className={isTimerActive && mode !== 'custom' ? "opacity-50 cursor-not-allowed" : ""}
                >
                    Custom
                </Button>
            </div>

            {/* Affichage du label de session si défini */}
            {sessionLabel && (
                <div className="mt-2"> {/* Espace au-dessus du label */}
                    <p className="text-lg font-semibold text-gray-700">{sessionLabel}</p>
                    {subMessage && <p className="text-xs text-gray-500">{subMessage}</p>}
                </div>
            )}

            <div className={`text-6xl font-mono font-bold ${mode === 'pomodoro' && currentSessionType === 'work' ? 'text-blue-600' :
                    mode === 'pomodoro' && (currentSessionType === 'shortBreak' || currentSessionType === 'longBreak') ? 'text-green-600' :
                        'text-gray-800' // Couleur par défaut ou pour custom
                }`}>
                {formatTime(minutes)}:{formatTime(seconds)}
            </div>
        </div>
    );
};