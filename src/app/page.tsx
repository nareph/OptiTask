// src/app/page.tsx
"use client";

import AnalyticsView from "@/components/analytics/AnalyticsView";
import CalendarView from "@/components/calendar/CalendarView";
import ProjectsView from "@/components/projects/ProjectsView";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isApiError } from "@/services/common";
import { fetchLabels } from "@/services/labelApi";
import { fetchProjects } from "@/services/projectApi";
import { Label, Project } from "@/services/types";
import { AlertCircle, LogOut, RefreshCw } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  console.log("DashboardPage: Render. Status:", sessionStatus, "Session User ID:", session?.user?.id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUserLabels, setAllUserLabels] = useState<Label[]>([]);
  const [isLoadingGlobalData, setIsLoadingGlobalData] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [currentTab, setCurrentTab] = useState("projects");

  const loadedSessionUserIdRef = useRef<string | null | undefined>(undefined);

  const loadGlobalData = useCallback(async (showLoadingIndicator = true, reason = "unknown") => {
    console.log(`DashboardPage: loadGlobalData called. Reason: ${reason}. ShowLoading: ${showLoadingIndicator}. Current Session User ID: ${session?.user?.id}`);

    if (sessionStatus !== "authenticated" || !session?.user?.id) {
      console.log("DashboardPage: loadGlobalData - Not authenticated or no user id. Aborting.");
      setProjects([]); setAllUserLabels([]);
      if (showLoadingIndicator) setIsLoadingGlobalData(false);
      setGlobalError(null);
      return;
    }
    if (!session) {
      console.log("DashboardPage: loadGlobalData - Session object is null. Aborting.");
      return;
    }

    if (showLoadingIndicator) setIsLoadingGlobalData(true);
    setGlobalError(null);

    try {
      const currentSessionForAPI = session;
      const [projectsResult, userLabelsResult] = await Promise.all([
        fetchProjects(currentSessionForAPI),
        fetchLabels(currentSessionForAPI)
      ]);


      if (session?.user?.id !== currentSessionForAPI.user?.id) {
        console.log("DashboardPage: loadGlobalData - User changed during fetch. Aborting state update.");
        if (showLoadingIndicator) setIsLoadingGlobalData(false);
        return;
      }

      if (isApiError(projectsResult)) {
        setGlobalError(prev => (prev ? `${prev}\n` : "") + `Failed to load projects: ${projectsResult.message}`);
        setProjects([]);
      } else {
        setProjects(projectsResult.sort((a, b) => a.name.localeCompare(b.name)));
      }

      if (isApiError(userLabelsResult)) {
        setGlobalError(prev => (prev ? `${prev}\n` : "") + `Failed to load labels: ${userLabelsResult.message}`);
        setAllUserLabels([]);
      } else {
        setAllUserLabels(userLabelsResult.sort((a, b) => a.name.localeCompare(b.name)));
      }

      if (!isApiError(projectsResult) && !isApiError(userLabelsResult)) {
        loadedSessionUserIdRef.current = currentSessionForAPI.user.id;
        console.log(`DashboardPage: loadGlobalData - Successfully loaded data for user ${currentSessionForAPI.user.id}. Updated loadedSessionUserIdRef.`);
      }

    } catch (err) {
      console.error("DashboardPage: Error in loadGlobalData Promise.all:", err);
      const defaultError = "An unknown error occurred while loading dashboard data.";
      setGlobalError(prev => (prev ? `${prev}\n` : "") + defaultError);
    } finally {
      if (showLoadingIndicator) setIsLoadingGlobalData(false);
    }
  }, [session, sessionStatus]);

  useEffect(() => {
    console.log(
      "DashboardPage: useEffect for session logic triggered. Status:", sessionStatus,
      "Session User ID:", session?.user?.id,
      "Loaded for User ID Ref:", loadedSessionUserIdRef.current
    );

    if (sessionStatus === "authenticated" && session?.user?.id) {
      if (loadedSessionUserIdRef.current === undefined || loadedSessionUserIdRef.current !== session.user.id) {
        console.log("DashboardPage: useEffect - Condition met for initial/user-changed data load.");
        loadGlobalData(true, "useEffect - initial/user-changed");
      } else {
        console.log("DashboardPage: useEffect - User ID is the same, no full reload by this effect.");
      }
    } else if (sessionStatus === "unauthenticated") {
      console.log("DashboardPage: useEffect - User unauthenticated. Resetting states and loadedSessionUserIdRef.");
      setProjects([]); setAllUserLabels([]);
      if (isLoadingGlobalData) setIsLoadingGlobalData(false);
      setGlobalError(null);
      loadedSessionUserIdRef.current = null;
    }
  }, [sessionStatus, session, loadGlobalData, isLoadingGlobalData]);

  const handleDataChanged = useCallback(() => {
    console.log("DashboardPage: handleDataChanged called by child. Reloading global data (discreetly).");
    loadGlobalData(false, "handleDataChanged");
  }, [loadGlobalData]);

  const handleLabelCreatedInTaskForm = useCallback((newLabel: Label) => {
    console.log("DashboardPage: handleLabelCreatedInTaskForm called with new label:", newLabel);
    setAllUserLabels(prevLabels =>
      [...prevLabels, newLabel].sort((a, b) => a.name.localeCompare(b.name))
    );
  }, []);

  const handlePomodoroStateChange = useCallback((isActive: boolean) => {
    console.log("DashboardPage: Pomodoro state changed:", isActive);
    setIsPomodoroActive(isActive);
  }, []);

  const handleTabChange = useCallback((value: string) => {
    if (isPomodoroActive && value !== "projects") {
      console.log("DashboardPage: Navigation blocked - Pomodoro is active");
      return;
    }
    setCurrentTab(value);
  }, [isPomodoroActive]);

  const getUserInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  if (sessionStatus === "loading") {
    console.log("DashboardPage: Rendering 'Initializing session...'");
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="p-8">
          <CardContent className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-xl text-muted-foreground">Initializing session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session && sessionStatus === "unauthenticated") {
    console.log("DashboardPage: Rendering 'Access Denied' (should be handled by middleware ideally)");
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Card className="p-8 max-w-md">
          <CardContent className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
            <p className="text-muted-foreground">Please sign in to view the dashboard.</p>
            <Button asChild className="w-full">
              <Link href="/api/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) { // Sécurité supplémentaire
    console.log("DashboardPage: Rendering null (session is null after status checks)");
    return null;
  }

  console.log("DashboardPage: Proceeding to render main content. isLoadingGlobalData:", isLoadingGlobalData);
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm sticky top-0 z-40 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">OptiTask</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => {
                  console.log("DashboardPage: Manual Refresh button clicked.");
                  loadedSessionUserIdRef.current = undefined; // Forcer le rechargement par useEffect
                  loadGlobalData(true, "Manual Refresh Button"); // Ou appeler directement
                }}
                disabled={isLoadingGlobalData}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingGlobalData ? 'animate-spin' : ''}`} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || 'User avatar'} />
                      <AvatarFallback>
                        {getUserInitials(session.user?.name, session.user?.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {session.user?.name && (
                        <p className="font-medium">{session.user.name}</p>
                      )}
                      {session.user?.email && (
                        <p className="text-xs text-muted-foreground">
                          {session.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => {
                      console.log("DashboardPage: Sign out button clicked.");
                      loadedSessionUserIdRef.current = null;
                      signOut({ callbackUrl: "/" });
                    }}
                    className="text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {globalError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {globalError}
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="projects"
                className="relative"
              >
                Projects
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                disabled={isPomodoroActive}
                className={`relative ${isPomodoroActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Analytics
                {isPomodoroActive && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                disabled={isPomodoroActive}
                className={`relative ${isPomodoroActive ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Calendar
                {isPomodoroActive && (
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-destructive rounded-full animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>

            {isPomodoroActive && currentTab !== "projects" && (
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  A Pomodoro session is active. Stay focused on the Projects tab to maintain your productivity!
                </AlertDescription>
              </Alert>
            )}

            <TabsContent value="projects" className="mt-6">
              <ProjectsView
                projects={projects}
                allUserLabels={allUserLabels}
                onDataChanged={handleDataChanged}
                onLabelCreated={handleLabelCreatedInTaskForm}
                onPomodoroStateChange={handlePomodoroStateChange}
                isLoading={isLoadingGlobalData}
                error={globalError}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <AnalyticsView session={session} />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <CalendarView />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}