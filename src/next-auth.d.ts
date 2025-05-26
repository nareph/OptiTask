// src/next-auth.d.ts
import { DefaultSession } from "next-auth";
import { JWT as NextAuthJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** L'ID unique de l'utilisateur. */
      id?: string | null;
    } & DefaultSession["user"]; // Conserve les champs par défaut comme name, email, image
  }

  // Si vous utilisez un Adapter et que le type User de l'adapter est différent,
  // vous pourriez avoir besoin de typer 'user' dans le callback jwt plus spécifiquement.
  // Pour l'instant, nous supposons que user.id est disponible sur l'objet User de NextAuth.
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends NextAuthJWT {
    /** L'ID unique de l'utilisateur. */
    id?: string | null;
  }
}