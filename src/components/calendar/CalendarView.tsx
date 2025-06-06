// src/components/calendar/CalendarView.tsx
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchGoogleCalendarEvents } from "@/services/calendarApi";
import { isApiError } from "@/services/common";
import { CalendarEvent } from "@/services/types";
import { AlertCircle, Calendar, ExternalLink, RefreshCw } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

export default function CalendarView() {
    const { data: session, status: sessionStatus } = useSession();

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);

    const loadGoogleCalendarEvents = useCallback(async () => {
        if (!session || sessionStatus !== "authenticated") {
            setIsGoogleCalendarConnected(false);
            return;
        }

        console.log("CalendarView: Attempting to fetch Google Calendar events...");
        setIsLoading(true);
        setError(null);
        setEvents([]);

        const result = await fetchGoogleCalendarEvents();

        if (isApiError(result)) {
            console.error("CalendarView: Failed to fetch Google Calendar events:", result.message, "Status:", result.statusCode);

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
            setIsGoogleCalendarConnected(true);
        }
        setIsLoading(false);
    }, [session, sessionStatus]);

    useEffect(() => {
        if (sessionStatus === "authenticated") {
            loadGoogleCalendarEvents();
        }
    }, [sessionStatus, loadGoogleCalendarEvents]);

    const handleConnectGoogleCalendar = () => {
        signIn('google', { callbackUrl: window.location.href });
    };

    const renderEvent = (event: CalendarEvent) => {
        const title = event.summary || "No Title";
        const startDateString = event.start?.dateTime || event.start?.date;
        let eventTime = "All-day";

        if (startDateString) {
            const startDate = new Date(startDateString);
            eventTime = startDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });

            if (event.start?.dateTime) {
                eventTime += `, ${startDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                })}`;
            }
        }

        return (
            <div key={event.id || startDateString} className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" title={title}>
                            {title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate" title={eventTime}>
                            {eventTime}
                        </p>
                    </div>
                </div>
                {event.htmlLink && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 p-1 h-auto"
                        asChild
                    >
                        <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                        >
                            <ExternalLink className="w-3 h-3" />
                            <span className="sr-only">View on Google</span>
                        </a>
                    </Button>
                )}
            </div>
        );
    };

    const renderLoadingState = () => (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-24" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="w-2 h-2 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );

    if (sessionStatus === "loading") {
        return renderLoadingState();
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Google Calendar
                        {isGoogleCalendarConnected && (
                            <Badge variant="secondary" className="ml-2">
                                Connected
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleConnectGoogleCalendar}
                            variant={isGoogleCalendarConnected ? "outline" : "default"}
                            size="sm"
                        >
                            {isGoogleCalendarConnected ? "Re-link Calendar" : "Connect Calendar"}
                        </Button>
                        {isGoogleCalendarConnected && (
                            <Button
                                onClick={loadGoogleCalendarEvents}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                className="px-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="sr-only">Refresh events</span>
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center py-10">
                        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-muted-foreground" />
                        <p className="text-muted-foreground">Loading calendar events...</p>
                    </div>
                )}

                {!isLoading && error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <span className="font-semibold">Error:</span> {error}
                        </AlertDescription>
                    </Alert>
                )}

                {!isLoading && !error && isGoogleCalendarConnected && events.length === 0 && (
                    <div className="text-center py-10">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            No upcoming events found in your Google Calendar for the next 7 days.
                        </p>
                    </div>
                )}

                {!isLoading && !error && !isGoogleCalendarConnected && (
                    <div className="text-center py-10">
                        <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">
                            Please connect your Google Calendar to see your events.
                        </p>
                        <Button onClick={handleConnectGoogleCalendar}>
                            Connect Google Calendar
                        </Button>
                    </div>
                )}

                {isGoogleCalendarConnected && events.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Upcoming Events (Next 7 Days)
                            </h3>
                            <Badge variant="outline">
                                {events.length} event{events.length !== 1 ? 's' : ''}
                            </Badge>
                        </div>
                        <Separator />
                        <ScrollArea className="h-[400px] rounded-md border">
                            <div className="divide-y">
                                {events.map(renderEvent)}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}