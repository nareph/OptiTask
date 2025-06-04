// src/components/calendar/CalendarView.tsx
"use client";

import { Button } from "@/components/ui/Button"; // Votre composant Bouton
import { RefreshIcon } from "@/components/ui/Icons"; // Votre composant Icône
import { fetchGoogleCalendarEvents } from "@/services/calendarApi"; // Le service que nous allons créer
import { isApiError } from "@/services/common";
import { CalendarEvent } from "@/services/types"; // Le type que vous avez défini
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

// Interface pour les props, si CalendarView en avait besoin directement de son parent
// interface CalendarViewProps {
//   session: Session | null; // Reçu de DashboardPage
// } 

export default function CalendarView(/* { session: passedSession }: CalendarViewProps */) {
    // Utiliser useSession directement ici est souvent plus simple pour les composants feuilles
    const { data: session, status: sessionStatus } = useSession();

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // État pour savoir si la connexion Google pour le calendrier est active/fonctionnelle
    const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

    const loadGoogleCalendarEvents = useCallback(async () => {
        if (!session || sessionStatus !== "authenticated") {
            setIsGoogleCalendarConnected(false); // Pas de session, pas connecté
            return;
        }

        console.log("CalendarView: Attempting to fetch Google Calendar events...");
        setIsLoading(true);
        setError(null);
        setEvents([]); // Clear previous events

        const result = await fetchGoogleCalendarEvents(); // Passer la session à votre API service

        if (isApiError(result)) {
            console.error("CalendarView: Failed to fetch Google Calendar events:", result.message, "Status:", result.statusCode, "ErrorCode:", result.message);
            // Si l'erreur est liée à l'authentification/token, marquer comme non connecté
            if (result.statusCode === 401 || result.statusCode === 403 || result.message?.includes("GOOGLE")) {
                setError(`Could not load Google Calendar: ${result.message}. Please try (re)connecting.`);
                setIsGoogleCalendarConnected(false);
            } else {
                setError(result.message || "An unexpected error occurred while fetching calendar events.");
            }
            setEvents([]);
        } else {
            console.log("CalendarView: Google Calendar events fetched successfully:", result.length);
            setEvents(result);
            setIsGoogleCalendarConnected(true); // Marquer comme connecté si le fetch réussit
        }
        setIsLoading(false);
    }, [session, sessionStatus]);

    useEffect(() => {
        // Charger les événements au montage si la session est déjà authentifiée
        // et si on pense que Google Calendar est connecté (ou pour vérifier la connexion)
        if (sessionStatus === "authenticated") {
            loadGoogleCalendarEvents();
        }
    }, [sessionStatus, loadGoogleCalendarEvents]); // Se redéclenche si la session change


    const handleConnectGoogleCalendar = () => {
        // Rediriger l'utilisateur pour autoriser l'accès à Google Calendar
        // Le callbackUrl doit ramener à cette page ou à une page qui peut gérer le résultat.
        // NextAuth s'occupera du flux OAuth et des scopes définis dans authOptions.
        signIn('google', { callbackUrl: window.location.href }); // Recharge la page actuelle après connexion/autorisation
    };

    const renderEvent = (event: CalendarEvent) => {
        const title = event.summary || "No Title";
        const startDateString = event.start?.dateTime || event.start?.date;
        let eventTime = "All-day";
        if (startDateString) {
            const startDate = new Date(startDateString);
            eventTime = startDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            if (event.start?.dateTime) { // Si c'est un événement avec une heure
                eventTime += `, ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }
        }

        return (
            <li key={event.id || startDateString} className="py-3 px-4 border-b last:border-b-0 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate" title={title}>{title}</p>
                        <p className="text-xs text-gray-500 truncate" title={eventTime}>{eventTime}</p>
                    </div>
                    {event.htmlLink && <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline ml-auto flex-shrink-0">[View on Google]</a>}
                </div>
            </li>
        );
    };

    if (sessionStatus === "loading") {
        return <div className="p-6 text-center text-gray-500 animate-pulse">Loading session information...</div>;
    }

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Google Calendar</h2>
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={handleConnectGoogleCalendar}
                        variant={isGoogleCalendarConnected ? "outline" : "primary"}
                        size="sm"
                    >
                        {isGoogleCalendarConnected ? "Refresh / Re-link Google Calendar" : "Connect Google Calendar"}
                    </Button>
                    {isGoogleCalendarConnected && (
                        <Button onClick={() => loadGoogleCalendarEvents()} variant="ghost" size="sm" title="Refresh events" disabled={isLoading}>
                            <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="ml-3 text-gray-500">Loading calendar events...</p>
                </div>
            )}

            {!isLoading && error && (
                <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
                    <p className="font-semibold">Error:</p>
                    <p>{error}</p>
                </div>
            )}

            {!isLoading && !error && isGoogleCalendarConnected && events.length === 0 && (
                <p className="text-gray-500 text-center py-10">No upcoming events found in your Google Calendar for the next 7 days.</p>
            )}
            {!isLoading && !error && !isGoogleCalendarConnected && (
                <p className="text-gray-500 text-center py-10">Please connect your Google Calendar to see your events.</p>
            )}

            {isGoogleCalendarConnected && events.length > 0 && (
                <div>
                    <h3 className="text-md font-medium text-gray-600 mb-3">Upcoming Events (Next 7 Days)</h3>
                    <ul className="border rounded-md shadow-sm bg-white max-h-[500px] overflow-y-auto">
                        {events.map(renderEvent)}
                    </ul>
                </div>
            )}
        </div>
    );
}