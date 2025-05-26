// src/middleware.ts
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    /*
     * Faire correspondre tous les chemins de requête sauf ceux qui commencent par:
     * - api (routes API, sauf /api/auth qui est géré par NextAuth)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'image Next.js)
     * - signin (notre page de connexion publique)
     * - favicon.ico (fichier favicon)
     * - Diverses extensions de fichiers image/font
     */
    "/((?!api/auth|_next/static|_next/image|signin|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}