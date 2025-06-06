// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { Account, User as NextAuthUser, Profile, Session } from "next-auth";
import { JWT } from "next-auth/jwt"; // JWT sera notre type étendu grâce à next-auth.d.ts
import GitHubProvider, { GithubProfile } from "next-auth/providers/github";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { v5 as uuidv5 } from 'uuid';

const MY_APP_NAMESPACE = 'b5a0278f-7a52-4c76-b640-2de2f346deaa';

// Vérification des variables d'environnement (inchangée)
if (!process.env.GOOGLE_CLIENT_ID) throw new Error("Missing GOOGLE_CLIENT_ID");
if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error("Missing GOOGLE_CLIENT_SECRET");
if (!process.env.GITHUB_CLIENT_ID) throw new Error("Missing GITHUB_CLIENT_ID");
if (!process.env.GITHUB_CLIENT_SECRET) throw new Error("Missing GITHUB_CLIENT_SECRET");
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') throw new Error("Missing NEXTAUTH_SECRET for production");
if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') console.warn("\x1b[33mwarn\x1b[0m - [NextAuth] Missing NEXTAUTH_URL for production.");

async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
    console.log("[NextAuth JWT CB] Attempting to refresh Google access token. Current expiry:", token.accessTokenExpires ? new Date(token.accessTokenExpires) : "N/A");
    try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: token.refreshToken!,
                grant_type: "refresh_token",
            }),
        });

        const refreshedTokens = await response.json();
        if (!response.ok) {
            console.error("[NextAuth JWT CB] Failed to refresh Google token, response:", refreshedTokens);
            // Si le refresh token est invalide (ex: révoqué), l'erreur est souvent 'invalid_grant'
            if (refreshedTokens.error === 'invalid_grant') {
                console.warn("[NextAuth JWT CB] Refresh token is invalid. User may need to re-authenticate.");
                return { ...token, error: "RefreshAccessTokenError", refreshToken: undefined, accessToken: undefined, accessTokenExpires: undefined }; // Invalider les tokens
            }
            throw new Error(refreshedTokens.error_description || "Unknown error during token refresh");
        }
        
        console.log("[NextAuth JWT CB] Google access token refreshed successfully.");
        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            error: undefined,
        };
    } catch (error) {
        console.error("[NextAuth JWT CB] Catch block: Error refreshing Google access token:", error);
        return { ...token, error: "RefreshAccessTokenError" };
    }
}

//export const authOptions: AuthOptions = {
  const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          scope: "openid email profile https://www.googleapis.com/auth/calendar.readonly"
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }: { user: NextAuthUser, account: Account | null, profile?: Profile }) {
      if (!account || !profile) {
        console.error("[NextAuth SignIn CB] Missing account or profile for user:", user.email);
        return false;
      }

      let providerAccountIdToUse: string | undefined;
      if (account.provider === "google") providerAccountIdToUse = (profile as GoogleProfile)?.sub;
      else if (account.provider === "github") providerAccountIdToUse = (profile as GithubProfile)?.id?.toString();
      
      if (!providerAccountIdToUse) {
        console.error(`[NextAuth SignIn CB] No providerAccountId for ${account.provider}.`);
        return false;
      }
      
      // user.id est de type `string` grâce à notre next-auth.d.ts `interface User`
      user.id = uuidv5(`${account.provider}-${providerAccountIdToUse}`, MY_APP_NAMESPACE);
      console.log(`[NextAuth SignIn CB] User: ${user.email}, Provider: ${account.provider}, App User ID: ${user.id}`);
      return true;
    },

    async jwt({ token, user, account }: { token: JWT, user?: NextAuthUser, account?: Account | null }) {
      // `user` et `account` ne sont disponibles que lors de la connexion initiale.
      // Pour les appels suivants (ex: useSession), seuls `token` (et d'autres comme `trigger`) sont passés.
      
      // Connexion initiale: stocker les informations du compte dans le token
      if (account && user) {
        console.log(`[NextAuth JWT CB] Initial sign-in for user ID: ${user.id}, provider: ${account.provider}`);
        
        token.id = user.id; // Notre UUIDv5
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        // account.expires_at est un timestamp UNIX (secondes) du moment de l'expiration.
        token.accessTokenExpires = account.expires_at ? (account.expires_at * 1000) : undefined;
        token.provider = account.provider;
        token.error = undefined; // Réinitialiser les erreurs

        console.log(`[NextAuth JWT CB] Tokens stored for ${account.provider}. AccessToken Expiry: ${token.accessTokenExpires ? new Date(token.accessTokenExpires) : 'N/A'}, RefreshToken present: ${!!token.refreshToken}`);
      }

      // Si le token est sur le point d'expirer (ex: dans les 5 prochaines minutes) ET qu'il n'y a pas déjà une erreur de refresh
      if (token.accessTokenExpires && Date.now() + (5 * 60 * 1000) > token.accessTokenExpires && token.error !== "RefreshAccessTokenError") {
        console.log(`[NextAuth JWT CB] Access token for ${token.provider} is expiring or expired. Attempting refresh.`);
        if (token.provider === "google" && token.refreshToken) {
          return refreshGoogleAccessToken(token); // Retourne le token mis à jour ou avec une erreur
        }
        console.warn(`[NextAuth JWT CB] Access token for ${token.provider} needs refresh, but no refresh logic or no refresh token.`);
      }

      return token; // Retourner le token (original ou avec erreur si le refresh n'a pas pu être tenté)
    },

    async session({ session, token }: { session: Session, token: JWT }) {
      // `token` est le JWT final après le callback `jwt` (potentiellement rafraîchi ou avec une erreur)
      // `session` est l'objet Session de base de NextAuth, que nous allons peupler.
      // Le type `Session` ici est notre type étendu grâce à `next-auth.d.ts`.

      if (token?.id && session.user) {
        session.user.id = token.id;
      } else if (session.user) {
        // Si token.id n'est pas défini, c'est un problème car notre app ID ne sera pas dans la session.
        // Cela ne devrait pas arriver pour un utilisateur authentifié si signIn et jwt fonctionnent.
        console.error("[NextAuth Session CB] token.id is missing! session.user.id will be default or undefined.");
        // Pour s'assurer que session.user.id est une string, même si vide:
        session.user.id = session.user.id || ""; 
      }
      
      if (token?.error) {
        session.error = token.error;
      } else {
        // S'assurer que session.error est undefined s'il n'y a pas d'erreur dans le token
        delete session.error;
      }
      
      console.log("[NextAuth Session CB] Final session object for client:", { userId: session.user?.id, error: session.error });
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };
