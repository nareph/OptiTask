// OptiTask/next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/rust/:path*',
        destination: 'http://localhost:8080/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Pour les avatars Google
        port: '',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com', // Pour les avatars GitHub
        port: '',
        pathname: '/u/**', // Le pattern typique pour les avatars GitHub (ex: /u/USER_ID?v=4)
      },
      // Ajoutez d'autres domaines ici si nécessaire à l'avenir
    ],
  },
  // Ajoutez ici d'autres configurations Next.js si nécessaire
};

export default nextConfig;