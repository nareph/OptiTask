// src/services/calendarApi.ts
import { ApiError } from "./common"; // Assurez-vous que apiRequest est configuré pour ne pas préfixer par /api/rust
import { CalendarEvent } from "./types"; // Assurez-vous que CalendarEvent est défini dans types.ts

// Définir le type CalendarEvent (peut être mis dans src/services/types.ts)
// export interface CalendarEvent {
//   id?: string;
//   summary?: string | null; // Google
//   start?: { dateTime?: string | null, date?: string | null, timeZone?: string | null };
//   end?: { dateTime?: string | null, date?: string | null, timeZone?: string | null };
//   htmlLink?: string | null; // Google
//   // Ajoutez d'autres champs si nécessaire
// }

const CALENDAR_API_ENDPOINT = '/api/calendar'; // Route de base pour nos API Next.js calendrier

/**
 * Fetches events from Google Calendar.
 * Note: This function doesn't need the session object passed directly if apiRequest
 * handles authentication implicitly (e.g., by relying on cookies managed by NextAuth).
 * However, passing `session` can be useful for logging or if `apiRequest` needs it explicitly.
 * For API routes, the session is typically derived from the request cookies server-side.
 */
export async function fetchGoogleCalendarEvents(
    // La session n'est pas strictement nécessaire ici car l'API Route /api/calendar/google
    // va extraire le token du cookie. Mais on peut la garder pour la cohérence.
    //_session: Session | null // Marqué comme non utilisé si apiRequest ne s'en sert pas
): Promise<CalendarEvent[] | ApiError> {
    console.log("calendarApi: fetchGoogleCalendarEvents called");

    try {
        const response = await fetch(`${CALENDAR_API_ENDPOINT}/google`); 
        
        if (!response.ok) {
            let errorMessage = `API request to /google failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && typeof errorData.error === 'string') {
                    errorMessage = errorData.error;
                }
                 // Si errorData contient errorCode, on pourrait l'utiliser
                return { status: "error", statusCode: response.status, message: errorMessage, ...errorData };
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_jsonError) {
                 // Si le corps de l'erreur n'est pas JSON ou est vide
                return { status: "error", statusCode: response.status, message: errorMessage };
            }
        }
        if (response.status === 204) return []; // No content
        return await response.json() as CalendarEvent[];

    } catch (error) {
        console.error(`calendarApi: Network or other error fetching Google Calendar events:`, error);
        let message = "Network error or unexpected issue fetching Google Calendar events.";
        if (error instanceof Error) { message = error.message; }
        return { status: "error", statusCode: 500, message: message };
    }
}