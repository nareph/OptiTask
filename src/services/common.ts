import { Session } from "next-auth";

export const API_BASE_URL = '/api/rust';

export interface ApiError {
  status: "error";
  statusCode: number;
  message: string;
}

interface FetchOptions extends RequestInit {
    userId?: string | null;
}

export function isApiError(obj: unknown): obj is ApiError {
  if (typeof obj === 'object' && obj !== null) {
    const potentialError = obj as Partial<ApiError>;
    return (
      potentialError.status === "error" &&
      typeof potentialError.statusCode === 'number' &&
      typeof potentialError.message === 'string'
    );
  }
  return false;
}

// Fonction helper générique pour les requêtes fetch
interface FetchOptions extends RequestInit {
    userId?: string | null; // Pour ajouter X-User-Id
}

export async function apiRequest<TSuccessResponse>(
    endpoint: string,
    options: FetchOptions = {},
    session?: Session | null
): Promise<TSuccessResponse | ApiError> {
    let response: Response | undefined;
    
    // Initialiser un objet Headers à partir de options.headers
    const finalHeaders = new Headers(options.headers || {}); // Headers prend HeadersInit

    if (options.userId) {
        finalHeaders.set('X-User-Id', options.userId); // Utiliser .set()
    } else if (session?.user?.id) {
        finalHeaders.set('X-User-Id', session.user.id); // Utiliser .set()
    }

    if (options.body && !finalHeaders.has('Content-Type')) { // Utiliser .has() et .set()
        finalHeaders.set('Content-Type', 'application/json');
    }

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: finalHeaders, // Passer l'objet Headers construit
        });

        // ... reste de la fonction ...
        if (!response.ok) {
            let errorMessage = `API request to ${endpoint} failed with status ${response.status}`;
            try {
                const errorData = await response.json();
                if (typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string') {
                    errorMessage = errorData.message;
                }
                console.error(`API Error (${response.status}) on ${endpoint}:`, errorData);
            } catch (jsonError) {
                console.warn(`API Error (${response.status}) on ${endpoint}, but failed to parse error body as JSON:`, jsonError);
            }
            return { status: "error", statusCode: response.status, message: errorMessage };
        }

        if (response.status === 204) {
            return {} as TSuccessResponse;
        }
        return await response.json() as TSuccessResponse;

    } catch (error) {
        console.error(`Network or other error on ${endpoint}:`, error);
        const statusCode = response?.status || 500;
        let message = `Network error or unexpected issue on ${endpoint}.`;
        if (error instanceof Error) { message = error.message; }
        else if (typeof error === 'string') { message = error; }
        return { status: "error", statusCode: statusCode, message: message };
    }
}