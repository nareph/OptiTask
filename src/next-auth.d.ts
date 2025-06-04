// src/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt"; // Importer DefaultJWT pour étendre JWT

declare module "next-auth" {
  /**
   * L'objet User reçu par les callbacks `signIn` et `jwt` (lors de la connexion initiale).
   * Il est aussi le type de base pour les utilisateurs si vous utilisez un Adapter.
   */
  interface User extends DefaultUser {
    // Notre ID d'application interne (UUIDv5) que nous assignons dans `signIn`
    id: string;
    // Un champ temporaire pour passer providerAccountId de `signIn` à `jwt` si besoin,
    // bien que `account.providerAccountId` soit directement disponible dans `jwt` lors de la connexion.
    // providerAccountId?: string; // Probablement pas nécessaire si `account` est utilisé dans `jwt`
  }

  /**
   * L'objet Session retourné par `useSession`, `getSession` et reçu
   * comme prop sur le `SessionProvider` React Context (côté client).
   */
  interface Session extends DefaultSession {
    user: {
      /** Notre ID d'application interne (UUIDv5). */
      id: string; // Non optionnel ici car on s'assure de le mettre
    } & DefaultSession["user"]; // Conserve les champs par défaut (name, email, image)

    /** Pour propager une erreur de rafraîchissement de token au client. */
    error?: "RefreshAccessTokenError";

    // Rappel: NE PAS EXPOSER accessToken ou refreshToken au client ici.
  }
}

declare module "next-auth/jwt" {
  /** 
   * Le token JWT décodé. C'est l'objet qui est encodé dans le cookie JWT.
   * Accessible via le callback `jwt` et la fonction `getToken()` (côté serveur).
   */
  interface JWT extends DefaultJWT { // Étend DefaultJWT pour inclure sub, name, email, picture par défaut
    /** Notre ID d'application interne (UUIDv5). */
    id?: string; // Optionnel ici car il est ajouté lors de la première connexion

    /** Access token du fournisseur OAuth (ex: Google). */
    accessToken?: string;
    /** Timestamp (en millisecondes) d'expiration de l'accessToken. */
    accessTokenExpires?: number;
    /** Refresh token du fournisseur OAuth. */
    refreshToken?: string;
    /** Nom du fournisseur OAuth (ex: "google", "github"). */
    provider?: string;
    
    /** Pour stocker une erreur survenue lors du rafraîchissement du token. */
    error?: "RefreshAccessTokenError";
  }
}