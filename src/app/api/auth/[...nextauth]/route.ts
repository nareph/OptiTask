import NextAuth, { AuthOptions } from "next-auth";
import GitHubProvider, { GithubProfile } from "next-auth/providers/github";
import GoogleProvider, { GoogleProfile } from "next-auth/providers/google";
import { v5 as uuidv5 } from 'uuid';

// --- CONFIGURATION UUID NAMESPACE ---
// !!! IMPORTANT: Générez VOTRE PROPRE UUID v4 une fois et mettez-le ici. !!!
// !!! NE PAS CHANGER CET UUID une fois que des utilisateurs ont des données. !!!
const MY_APP_NAMESPACE = 'b5a0278f-7a52-4c76-b640-2de2f346deaa';
// --- FIN CONFIGURATION UUID NAMESPACE ---


// Vérification des variables d'environnement au démarrage
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}
if (!process.env.GITHUB_CLIENT_ID) {
  throw new Error("Missing GITHUB_CLIENT_ID environment variable");
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("Missing GITHUB_CLIENT_SECRET environment variable");
}
if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error("Missing NEXTAUTH_SECRET environment variable for production");
}
if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
    console.warn(
      "\x1b[33mwarn\x1b[0m - [NextAuth] Missing NEXTAUTH_URL environment variable for production. NextAuth.js may not work as expected."
    );
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
  ],
  session: {
    // Stratégie JWT car nous n'utilisons pas d'adapter pour stocker les sessions en DB
    strategy: "jwt",
  },
  callbacks: {
    // Le callback signIn est appelé lors d'une tentative de connexion, avant la création du JWT.
    // Nous l'utilisons pour générer notre UUID interne et l'attacher à l'objet `user`.
    async signIn({ user, account, profile }) {
      if (!account || (!profile && !user)) { // Vérifications de base
        console.error("[NextAuth SignIn CB] Missing account or profile/user information.");
        return false; // Empêcher la connexion
      }

      let providerAccountId: string | undefined;

      // Extraire l'ID unique du compte fournisseur.
      // GoogleProfile a `sub`, GithubProfile a `id` (un nombre).
      if (account.provider === "google") {
        providerAccountId = (profile as GoogleProfile)?.sub;
      } else if (account.provider === "github") {
        providerAccountId = (profile as GithubProfile)?.id?.toString();
      }

      if (!providerAccountId) {
        console.error(`[NextAuth SignIn CB] Could not extract providerAccountId for provider: ${account.provider}. Profile:`, profile);
        return false; // Empêcher la connexion
      }

      // Créer un nom unique basé sur le fournisseur et son ID de compte pour générer l'UUID v5
      const uniqueNameForUuidInput = `${account.provider}-${providerAccountId}`;
      const generatedAppUserId = uuidv5(uniqueNameForUuidInput, MY_APP_NAMESPACE);

      // Attacher notre UUID d'application généré à l'objet `user`.
      // Cet objet `user` sera ensuite passé au callback `jwt`.
      user.id = generatedAppUserId;

      // Optionnel: Mettre à jour/standardiser les champs de l'objet `user`
      // si les noms de champs du `profile` diffèrent de ce que `jwt` ou `session` attendent.
      // Pour Google et GitHub, NextAuth fait généralement un bon travail de mappage initial.
      // user.name = profile?.name ?? user.name;
      // user.email = profile?.email ?? user.email;
      // user.image = profile?.image ?? user.image;

      console.log(`[NextAuth SignIn CB] Provider: ${account.provider}, ProviderAccountId: ${providerAccountId}, GeneratedAppUserId: ${user.id}`);
      return true; // Autoriser la connexion
    },

    // Le callback jwt est appelé à chaque fois qu'un JWT est créé ou mis à jour.
    // `user` est l'objet enrichi par le callback `signIn` (avec user.id = notre UUIDv5).
    async jwt({ token, user }) {
      // Lors de la connexion initiale (trigger === "signIn" ou "oAuthCallback"), `user` est présent.
      if (user?.id) { // user.id est notre UUIDv5 généré
        token.id = user.id;
        // Les informations standards (name, email, picture) sont généralement
        // déjà ajoutées au token par NextAuth si elles sont dans l'objet `user`.
        // Si vous voulez être explicite ou ajouter d'autres infos du `user` au `token`:
        // token.name = user.name;
        // token.email = user.email;
        // token.picture = user.image;
      }
      // Sur les appels suivants (ex: `useSession`, `getServerSession`), `user` n'est pas là,
      // mais le `token` existant (avec notre `token.id`) est fourni.
      return token;
    },

    // Le callback session est appelé chaque fois qu'une session est accédée (côté client ou serveur).
    // Il reçoit le `token` du callback `jwt`.
    async session({ session, token }) {
      // Propagez l'ID (notre UUIDv5) du token à l'objet `session.user`.
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      // Les champs `session.user.name`, `session.user.email`, `session.user.image`
      // sont normalement déjà remplis par NextAuth à partir du token JWT.
      return session;
    },
  },
  pages: {
    signIn: '/signin', // Votre page de connexion personnalisée
    // error: '/auth/error', // Page d'erreur personnalisée (optionnel)
  },
  debug: process.env.NODE_ENV === 'development',
  // secret: process.env.NEXTAUTH_SECRET, // Lu automatiquement depuis .env
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
