// OptiTask/src/app/page.tsx (Maintenant votre Dashboard)
"use client"; // Ce composant utilise des hooks, donc il reste un Client Component

import { signOut, useSession } from "next-auth/react";
import Image from 'next/image';
import { useRouter } from "next/navigation"; // Pour la redirection si besoin (bien que le middleware s'en chargera)
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Le middleware devrait gérer la redirection si non authentifié.
  // Mais une vérification côté client est une bonne pratique en complément.
  useEffect(() => {
    if (status === "unauthenticated") {
      // router.push("/signin"); // Le middleware s'en chargera mais c'est une sécurité en plus
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  // Si la session n'est pas chargée et que l'utilisateur n'est pas authentifié,
  // le middleware devrait déjà avoir redirigé. Mais au cas où :
  if (!session) {
    // Normalement, le middleware redirige avant d'arriver ici.
    // Vous pourriez afficher un message ou un bouton pour se connecter,
    // mais l'idéal est que le middleware gère cela.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl text-gray-500">Redirecting to sign in...</p>
      </div>
    );
  }

  // L'utilisateur est authentifié
  return (
    <main className="flex flex-col items-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <header className="w-full max-w-4xl py-4 px-6 bg-white shadow-md rounded-b-lg mb-8 flex justify-between items-center">
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
              onClick={() => signOut({ callbackUrl: "/signin" })} // Redirige vers la page de connexion après déconnexion
              className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-md hover:bg-red-600 transition duration-300"
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <section className="w-full max-w-4xl p-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Welcome, {session.user?.name}!</h2>
        <p className="text-gray-600">This is your protected dashboard area.</p>
        {session.user?.id && (
          <p className="mt-2 text-xs text-gray-400">Your User ID: {session.user.id}</p>
        )}
        {/* Ici viendront vos composants de gestion de tâches, etc. */}
      </section>

      {/* Pour le debug */}
      {/* <pre className="mt-8 p-4 bg-gray-800 text-white text-xs rounded overflow-x-auto">
        {JSON.stringify(session, null, 2)}
      </pre> */}
    </main>
  );
}