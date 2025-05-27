"use client";

import ProjectList from "@/components/projects/ProjectList";
import TaskList from "@/components/tasks/TaskList"; // Importer TaskList
import { signOut, useSession } from "next-auth/react";
import Image from 'next/image';
import { useState } from "react"; // Importer useState pour gérer le projet sélectionné

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Callback pour ProjectList pour définir le projet sélectionné
  // Vous passerez cette fonction à ProjectList si vous voulez que cliquer sur un projet filtre les tâches
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleProjectSelect = (projectId: string | null) => {
    setSelectedProjectId(projectId);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-500 animate-pulse">Loading dashboard...</p>
        {/* Vous pourriez ajouter un spinner plus élaboré ici */}
      </div>
    );
  }

  // Le middleware devrait gérer la redirection si non authentifié.
  // Cette vérification est une sécurité supplémentaire.
  if (!session && status === "unauthenticated") {
    // Idéalement, le middleware a déjà redirigé vers /signin.
    // Si ce n'est pas le cas, l'utilisateur verra ce message.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white shadow-xl rounded-lg text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-700">You need to be signed in to view this page.</p>
          {/* Bouton pour aller à la page de connexion, au cas où */}
          <a href="/signin" className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  // S'assurer que la session existe avant de continuer
  if (!session) {
    // Ce cas ne devrait pratiquement jamais être atteint si le middleware et le check ci-dessus fonctionnent
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">OptiTask</h1>
              {/* Potentiellement un menu de navigation ici plus tard */}
            </div>
            {session.user && (
              <div className="flex items-center space-x-3">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-gray-200"
                    priority
                  />
                )}
                <span className="text-sm font-medium text-gray-700 hidden md:block">
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                  className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition duration-300"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {/* Grille pour la mise en page Projets / Tâches */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Colonne des Projets */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="p-4 sm:p-6 bg-white shadow-lg rounded-xl">
                <ProjectList
                //   onProjectSelect={handleProjectSelect} // Décommentez si ProjectList peut notifier un projet sélectionné
                //   selectedProjectId={selectedProjectId}  // Pour mettre en évidence le projet sélectionné
                />
              </div>
            </div>

            {/* Colonne des Tâches */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="p-4 sm:p-6 bg-white shadow-lg rounded-xl">
                <TaskList
                  projectIdForFilter={selectedProjectId} // Passer le projet sélectionné pour filtrer les tâches
                />
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Pour le debug de la session */}
      {/* <div className="fixed bottom-0 right-0 p-4 m-4 bg-gray-800 text-white text-xs rounded shadow-lg max-w-md max-h-64 overflow-auto">
        <h4 className="font-bold mb-2">Session Data:</h4>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div> */}
    </div>
  );
}