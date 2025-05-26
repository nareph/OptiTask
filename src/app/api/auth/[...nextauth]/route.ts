// OptiTask/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github"; // Importez GitHubProvider
import GoogleProvider from "next-auth/providers/google";

// Vérification des variables d'environnement au démarrage
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}

// Ajoutez les vérifications pour GitHub
if (!process.env.GITHUB_CLIENT_ID) {
  throw new Error("Missing GITHUB_CLIENT_ID environment variable");
}
if (!process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("Missing GITHUB_CLIENT_SECRET environment variable");
}

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error("Missing NEXTAUTH_SECRET environment variable for production");
}
// NEXTAUTH_URL est également important, surtout pour la production.
// NextAuth peut souvent le déduire, mais il est bon de s'assurer qu'il est défini
// dans .env.local (ex: NEXTAUTH_URL=http://localhost:3000 pour le dev)
// et dans vos variables d'environnement de production.
if (!process.env.NEXTAUTH_URL && process.env.NODE_ENV === 'production') {
    console.warn( // Avertissement plutôt qu'une erreur bloquante, mais à surveiller
      "\x1b[33mwarn\x1b[0m Missing NEXTAUTH_URL environment variable for production. NextAuth.js may not work as expected."
    );
}


export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID, // Pas besoin de "as string" si vérifié avant
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({ // Ajoutez le fournisseur GitHub
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  pages: {
    signIn: '/signin', // Spécifiez votre page de connexion personnalisée
    // error: '/auth/error', // Vous pouvez créer une page d'erreur personnalisée si vous le souhaitez
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Le paramètre 'user' n'est présent que lors de la première connexion après l'authentification.
      // Pour les appels suivants, seul 'token' est disponible.
      if (user) {
        token.id = user.id; // 'user.id' vient du profil retourné par le fournisseur ou de l'adapter
      }
      // Vous pourriez aussi vouloir stocker l'access_token du fournisseur si besoin
      // if (account) {
      //   token.accessToken = account.access_token;
      // }
      return token;
    },
    async session({ session, token }) {
      // 'token' contient les données du callback jwt (y compris token.id)
      // Assigner l'id au session.user pour qu'il soit accessible côté client
      if (token && session.user) {
        session.user.id = token.id as string; // Castez car nous savons qu'il sera là
      }
      return session;
    },
  },
  // Activer le debug uniquement en développement pour éviter de fuiter des infos sensibles
  debug: process.env.NODE_ENV === 'development',

  // secret: process.env.NEXTAUTH_SECRET, // NextAuth le lit automatiquement s'il est dans .env.local ou les variables d'env du serveur
  
  // pages: { // Décommentez et personnalisez si vous avez des pages de connexion/erreur spécifiques
  //   signIn: '/auth/signin',
  //   signOut: '/auth/signout',
  //   error: '/auth/error', // Error code passed in query string comme error=OAuthAccountNotLinked
  //   verifyRequest: '/auth/verify-request', // (used for email/passwordless sign in)
  //   newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  // },

  // callbacks: { // Vous pouvez ajouter des callbacks ici pour personnaliser le comportement
    // async jwt({ token, user, account }) {
    //   // Persist the OAuth access_token and or the user id to the token right after signin
    //   if (account && user) {
    //     token.accessToken = account.access_token;
    //     token.id = user.id; // Assurez-vous que votre 'user' object a un 'id'
    //   }
    //   return token;
    // },
    // async session({ session, token }) {
    //   // Send properties to the client, like an access_token and user id from a provider.
    //   (session.user as any).accessToken = token.accessToken; // Castez session.user pour ajouter des propriétés
    //   (session.user as any).id = token.id;
    //   return session;
    // },
  // }
  // L'adapter sera nécessaire si vous voulez stocker les utilisateurs/sessions dans votre propre base de données
  // import { SupabaseAdapter } from "@auth/supabase-adapter" // Exemple
  // adapter: SupabaseAdapter({ ... })
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
