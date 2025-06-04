// src/app/api/calendar/google/route.ts
import { calendar_v3, google } from 'googleapis'; // calendar_v3.Schema$Event pour la réponse succès
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Missing GOOGLE_CLIENT_ID");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("Missing GOOGLE_CLIENT_SECRET");
if (!process.env.NEXTAUTH_SECRET) throw new Error("Missing NEXTAUTH_SECRET for API route token decryption");

// Interface pour les erreurs de l'API Google (peut être affinée)
interface GoogleApiError extends Error {
    code?: number | string;
    errors?: Array<{ // Structure typique pour les erreurs détaillées de Google
        domain?: string;
        reason?: string;
        message?: string;
        locationType?: string;
        location?: string;
    }>;
    response?: { // Pour les erreurs capturées par Gaxios (le client HTTP de googleapis)
        data?: { // Ce 'data' est la partie que nous voulons typer mieux
            error?: string | { errors?: GoogleApiError['errors'], code?: number, message?: string }; // Peut être une chaîne ou un objet
            error_description?: string;
            // D'autres champs peuvent exister selon le type d'erreur
        };
        status?: number;
        statusText?: string;
    };
}

export async function GET(req: NextRequest) {
    const secret = process.env.NEXTAUTH_SECRET!; // On a vérifié au-dessus
    const token = await getToken({ req, secret });

    if (!token || !token.id) {
        return NextResponse.json({ error: "Unauthorized: No session token or user ID" }, { status: 401 });
    }
    if (token.provider !== "google") {
        return NextResponse.json({ error: "User not authenticated with Google for this session" }, { status: 403 });
    }
    if (token.error === "RefreshAccessTokenError") {
        return NextResponse.json({ error: "Token refresh previously failed. Please re-authenticate.", errorCode: "GOOGLE_REFRESH_FAILED_PERSISTENT" }, { status: 401 });
    }
    if (!token.accessToken) {
        return NextResponse.json({ error: "Missing Google access token. Please re-authenticate.", errorCode: "GOOGLE_NO_ACCESS_TOKEN" }, { status: 401 });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: token.accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.valueOf() + 7 * 24 * 60 * 60 * 1000);
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: sevenDaysFromNow.toISOString(),
            maxResults: 20,
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events: calendar_v3.Schema$Event[] = response.data.items || [];
        return NextResponse.json(events);

    } catch (error) {
        console.error('[API/Calendar/Google] Error during Google Calendar API call:', error);
        
        let errorMessage = "An unknown error occurred while fetching Google Calendar events.";
        let errorCode: string | undefined = "GOOGLE_UNKNOWN_API_ERROR";
        let status = 500;

        const typedError = error as GoogleApiError; // Type assertion

        // Tenter d'extraire des infos plus précises de l'erreur
        if (typedError.message) {
            errorMessage = typedError.message;
        }

        if (typedError.response) { // Si l'erreur vient de Gaxios (client HTTP de googleapis)
            if (typedError.response.status) {
                status = typedError.response.status;
            }
            if (typedError.response.data) {
                const errorData = typedError.response.data;
                // La structure de errorData.error peut être une chaîne ou un objet
                if (typeof errorData.error === 'string') {
                    errorMessage = errorData.error_description || errorData.error || errorMessage;
                    errorCode = `GOOGLE_API_${errorData.error.toUpperCase()}`;
                } else if (typeof errorData.error === 'object' && errorData.error !== null) {
                    // Si errorData.error est un objet (comme pour les erreurs 4xx structurées)
                    const structuredError = errorData.error;
                    if (structuredError.message) errorMessage = structuredError.message;
                    if (structuredError.errors && structuredError.errors.length > 0 && structuredError.errors[0].message) {
                        errorMessage = structuredError.errors[0].message;
                        if (structuredError.errors[0].reason) {
                            errorCode = `GOOGLE_API_${structuredError.errors[0].reason.toUpperCase()}`;
                        }
                    }
                    if (structuredError.code) status = structuredError.code; // Peut être un code d'erreur interne Google, ou HTTP
                }
            }
        } else if (typedError.errors && typedError.errors.length > 0) {
            // Parfois, l'erreur principale contient directement le tableau 'errors'
            errorMessage = typedError.errors[0].message || errorMessage;
            if (typedError.errors[0].reason) {
                errorCode = `GOOGLE_API_${typedError.errors[0].reason.toUpperCase()}`;
            }
        }
        
        // Raffiner le statut pour les erreurs d'authentification/autorisation
        const lowerErrorMessage = errorMessage.toLowerCase();
        if (status === 401 || status === 403 || 
            errorCode?.includes("AUTH") || errorCode?.includes("FORBIDDEN") || 
            lowerErrorMessage.includes("invalid_grant") || lowerErrorMessage.includes("invalid credentials") || lowerErrorMessage.includes("token has been expired or revoked")) {
            status = 401; 
            errorMessage = 'Authentication with Google failed. Token might be invalid, revoked, or permissions insufficient. Please re-connect your Google account.';
            errorCode = "GOOGLE_AUTH_FAILURE_API_CALL";
        }
        
        return NextResponse.json({ error: errorMessage, errorCode }, { status });
    }
}