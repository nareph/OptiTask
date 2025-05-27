// OptiTask/src/app/page.tsx (DashboardPage)
"use client";

import ProjectList from "@/components/projects/ProjectList"; // Importez le composant
import { signOut, useSession } from "next-auth/react";
import Image from 'next/image';
// import { useRouter } from "next/navigation"; // Pas nécessaire si le middleware gère
// import { useEffect } from "react"; // Pas nécessaire si le middleware gère

export default function DashboardPage() {
  const { data: session, status } = useSession();
  // const router = useRouter(); // Plus besoin

  // useEffect(() => { // Plus besoin, le middleware gère
  //   if (status === "unauthenticated") {
  //     // router.push("/signin");
  //   }
  // }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!session) { // Le middleware devrait avoir redirigé, ceci est une fallback
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-gray-500">You need to be signed in to view this page.</p>
        {/* Optionnel: bouton pour rediriger manuellement si le middleware a un souci */}
        {/* <button onClick={() => router.push('/signin')}>Sign In</button> */}
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <header className="w-full max-w-4xl py-4 px-6 bg-white shadow-md rounded-b-lg mb-8 flex justify-between items-center">
        {/* ... (votre header existant) ... */}
        <h1 className="text-2xl font-bold text-blue-600">OptiTask Dashboard</h1>
        {session.user && (
          <div className="flex items-center space-x-3">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt={session.user.name || "User avatar"}
                width={40}
                height={40}
                className="rounded-full border-2 border-blue-300"
                priority
              />
            )}
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{session.user.name || session.user.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition duration-300"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <section className="w-full max-w-4xl p-6 bg-white shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Welcome, {session.user?.name}!
          </h2>
          {/* Vous ajouterez un bouton "Add Project" ici plus tard */}
        </div>

        <ProjectList /> {/* Intégrer ProjectList ici */}

        {/* Pour le debug */}
        {/* <pre className="mt-8 p-4 bg-gray-800 text-white text-xs rounded overflow-x-auto">
          {JSON.stringify(session, null, 2)}
        </pre> */}
      </section>
    </main>
  );
}