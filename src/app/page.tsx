// src/app/dashboard/page.tsx
"use client";

import ProjectsView from "@/components/projects/ProjectsView";
import { isApiError } from "@/services/common";
import { fetchLabels } from "@/services/labelApi";
import { fetchProjects } from "@/services/projectApi";
import { Label, Project } from "@/services/types";
import { signOut, useSession } from "next-auth/react";
import Image from 'next/image';
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react"; // useRef ajouté

const RefreshIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0015.357 2M15 15h-4.581"></path></svg>;

export default function DashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  console.log("DashboardPage: Render. Status:", sessionStatus, "Session User ID:", session?.user?.id);

  const [projects, setProjects] = useState<Project[]>([]);
  const [allUserLabels, setAllUserLabels] = useState<Label[]>([]);
  //const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  //const [projectNameForFilter, setProjectNameForFilter] = useState<string | null>(null);
  const [isLoadingGlobalData, setIsLoadingGlobalData] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Utiliser loadedSessionUserIdRef pour suivre pour quel utilisateur les données ont été chargées
  const loadedSessionUserIdRef = useRef<string | null | undefined>(undefined); // undefined = jamais chargé, null = déconnecté

  const loadGlobalData = useCallback(async (showLoadingIndicator = true, reason = "unknown") => {
    console.log(`DashboardPage: loadGlobalData called. Reason: ${reason}. ShowLoading: ${showLoadingIndicator}. Current Session User ID: ${session?.user?.id}`);

    if (sessionStatus !== "authenticated" || !session?.user?.id) {
      console.log("DashboardPage: loadGlobalData - Not authenticated or no user id. Aborting.");
      setProjects([]); setAllUserLabels([]);
      if (showLoadingIndicator) setIsLoadingGlobalData(false);
      setGlobalError(null);
      return;
    }
    if (!session) { // Double-check, sessionStatus devrait suffire
      console.log("DashboardPage: loadGlobalData - Session object is null. Aborting.");
      return;
    }

    if (showLoadingIndicator) setIsLoadingGlobalData(true);
    setGlobalError(null); // Réinitialiser l'erreur à chaque tentative de chargement

    try {
      const currentSessionForAPI = session; // Capturer la session pour les appels
      const [projectsResult, userLabelsResult] = await Promise.all([
        fetchProjects(currentSessionForAPI),
        fetchLabels(currentSessionForAPI)
      ]);

      // Vérifier si l'utilisateur actuel est toujours le même que celui qui a initié le fetch
      // Cela évite de mettre à jour l'état si l'utilisateur s'est déconnecté/reconnecté pendant le fetch
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

      // Marquer que les données ont été chargées pour cet utilisateur
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
  }, [session, sessionStatus]); // `session` et `sessionStatus` sont des dépendances clés

  useEffect(() => {
    console.log(
      "DashboardPage: useEffect for session logic triggered. Status:", sessionStatus,
      "Session User ID:", session?.user?.id,
      "Loaded for User ID Ref:", loadedSessionUserIdRef.current
    );

    if (sessionStatus === "authenticated" && session?.user?.id) {
      // Charger les données si:
      // 1. C'est la première fois (loadedSessionUserIdRef.current est undefined)
      // 2. OU l'ID utilisateur a changé (l'utilisateur s'est reconnecté avec un autre compte)
      if (loadedSessionUserIdRef.current === undefined || loadedSessionUserIdRef.current !== session.user.id) {
        console.log("DashboardPage: useEffect - Condition met for initial/user-changed data load.");
        loadGlobalData(true, "useEffect - initial/user-changed");
      } else {
        console.log("DashboardPage: useEffect - User ID is the same, no full reload by this effect.");
        // Ici, on pourrait envisager un `loadGlobalData(false)` si la *référence* de session a changé
        // mais que l'ID est le même, pour un rafraîchissement discret des données (ex: token update).
        // Mais pour l'instant, on le garde simple pour éviter les boucles.
      }
    } else if (sessionStatus === "unauthenticated") {
      console.log("DashboardPage: useEffect - User unauthenticated. Resetting states and loadedSessionUserIdRef.");
      setProjects([]); setAllUserLabels([]);
      if (isLoadingGlobalData) setIsLoadingGlobalData(false); // S'assurer que le chargement s'arrête
      setGlobalError(null);
      // setSelectedProjectId(null);
      // setProjectNameForFilter(null);
      loadedSessionUserIdRef.current = null; // Marquer comme déconnecté
    }
  }, [sessionStatus, session, loadGlobalData, isLoadingGlobalData]); // Ajouter isLoadingGlobalData pour éviter des appels si déjà en chargement

  const handleDataChanged = useCallback(() => {
    // Ce callback est appelé par les composants enfants après CUD.
    // Il doit déclencher un re-fetch discret des données.
    console.log("DashboardPage: handleDataChanged called by child. Reloading global data (discreetly).");
    loadGlobalData(false, "handleDataChanged");
  }, [loadGlobalData]);

  const handleLabelCreatedInTaskForm = useCallback((newLabel: Label) => {
    console.log("DashboardPage: handleLabelCreatedInTaskForm called with new label:", newLabel);
    setAllUserLabels(prevLabels =>
      [...prevLabels, newLabel].sort((a, b) => a.name.localeCompare(b.name))
    );
  }, []); // Pas de dépendances, car met à jour l'état localement

  /*   const handleProjectSelect = (projectId: string | null) => {
      console.log("DashboardPage: handleProjectSelect called with projectId:", projectId);
      setSelectedProjectId(projectId);
      if (projectId) {
        const selectedProject = projects.find(p => p.id === projectId);
        setProjectNameForFilter(selectedProject ? selectedProject.name : null);
      } else {
        setProjectNameForFilter(null);
      }
    }; */

  if (sessionStatus === "loading") {
    console.log("DashboardPage: Rendering 'Initializing session...'");
    return (<div className="flex items-center justify-center min-h-screen bg-gray-100"><p className="text-xl text-gray-500 animate-pulse">Initializing session...</p></div>);
  }
  if (!session && sessionStatus === "unauthenticated") {
    console.log("DashboardPage: Rendering 'Access Denied' (should be handled by middleware ideally)");
    return (<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100"><div className="p-8 bg-white shadow-xl rounded-lg text-center"><h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1><p className="text-gray-700">Please sign in to view the dashboard.</p><Link href="/api/auth/signin" className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">Sign In</Link></div></div>);
  }
  if (!session) { // Sécurité supplémentaire
    console.log("DashboardPage: Rendering null (session is null after status checks)");
    return null;
  }

  console.log("DashboardPage: Proceeding to render main content. isLoadingGlobalData:", isLoadingGlobalData);
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center"> <h1 className="text-2xl font-bold text-blue-600">OptiTask</h1> </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  console.log("DashboardPage: Manual Refresh button clicked.");
                  loadedSessionUserIdRef.current = undefined; // Forcer le rechargement par useEffect
                  loadGlobalData(true, "Manual Refresh Button"); // Ou appeler directement
                }}
                disabled={isLoadingGlobalData}
                className="p-1.5 text-gray-500 hover:text-blue-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
                title="Refresh All Data"
              >
                <RefreshIcon />
              </button>
              {session.user?.image && (<Image src={session.user.image} alt={session.user.name || "User avatar"} width={36} height={36} className="rounded-full border" priority />)}
              <span className="text-sm font-medium text-gray-700 hidden md:block"> {session.user?.name || session.user?.email} </span>
              <button
                onClick={() => {
                  console.log("DashboardPage: Sign out button clicked.");
                  loadedSessionUserIdRef.current = null; // Prépare pour le prochain login
                  signOut({ callbackUrl: "/" });
                }}
                className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600"
              > Sign out </button>
            </div>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {globalError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
              Error: {globalError}
            </div>
          )}

          <ProjectsView
            projects={projects}
            allUserLabels={allUserLabels}
            onDataChanged={handleDataChanged}
            onLabelCreated={handleLabelCreatedInTaskForm}
            isLoading={isLoadingGlobalData}
            error={globalError}
          />
        </div>
      </main>
    </div>

  );
}