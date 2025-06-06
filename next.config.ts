// OptiTask/next.config.ts
import { NextConfig } from 'next';

const RUST_BACKEND_URL = process.env.NEXT_PUBLIC_RUST_BACKEND_URL || 'http://localhost:8080';


const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/rust/:path*',
        destination: `${RUST_BACKEND_URL}/:path*`,
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