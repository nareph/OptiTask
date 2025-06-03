// src/services/analyticsApi.ts
import { Session } from "next-auth";
import { ApiError, apiRequest } from "./common"; // Supposant que common.ts existe et exporte ces types/fonctions
import { AnalyticsQueryArgs, ProductivityTrendPoint, TimeByProjectStat } from "./types";


const ANALYTICS_API_ENDPOINT = '/analytics'; // Basé sur votre scope Actix

export async function fetchTimeByProject(
    session: Session | null,
    params: AnalyticsQueryArgs
): Promise<TimeByProjectStat[] | ApiError> {
    if (!session?.user?.id) {
        return { status: "error", statusCode: 401, message: "User not authenticated for fetchTimeByProject" };
    }

    const queryParams = new URLSearchParams();
    if (params.period && params.period !== 'custom') queryParams.append('period', params.period);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();

    return apiRequest<TimeByProjectStat[]>(
        `${ANALYTICS_API_ENDPOINT}/time-by-project${queryString ? '?' + queryString : ''}`,
        { method: 'GET' },
        session
    );
}

export async function fetchProductivityTrend(
    session: Session | null,
    params: AnalyticsQueryArgs
): Promise<ProductivityTrendPoint[] | ApiError> {
    if (!session?.user?.id) {
        return { status: "error", statusCode: 401, message: "User not authenticated for fetchProductivityTrend" };
    }

    const queryParams = new URLSearchParams();
    if (params.period && params.period !== 'custom') queryParams.append('period', params.period);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    const queryString = queryParams.toString();

    return apiRequest<ProductivityTrendPoint[]>(
        `${ANALYTICS_API_ENDPOINT}/productivity-trend${queryString ? '?' + queryString : ''}`,
        { method: 'GET' },
        session
    );
}