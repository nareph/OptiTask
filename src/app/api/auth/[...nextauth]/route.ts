// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"

export const authOptions: AuthOptions = {
  // Configure one or more authentication providers
  providers: [
    // Nous ajouterons Google et GitHub ici plus tard
  ],
  // Vous pouvez ajouter d'autres options ici comme :
  // secret: process.env.NEXTAUTH_SECRET, // Essentiel en production
  // pages: {
  //   signIn: '/auth/signin', // Page de connexion personnalisée si besoin
  // },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
