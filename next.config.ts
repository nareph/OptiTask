// OptiTask/next.config.ts
import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/rust/:path*', // Tout ce qui commence par /api/rust/
        destination: 'http://localhost:8080/:path*', // Sera redirigé vers votre backend Rust
      },
    ];
  },
  // Ajoutez ici d'autres configurations Next.js si nécessaire
};

export default nextConfig;