// OptiTask/next.config.ts
import { NextConfig } from 'next';

// Validate and provide detailed error for missing backend URL
const RUST_BACKEND_URL = (() => {
  const url = process.env.NEXT_PUBLIC_RUST_BACKEND_URL;
  if (!url && process.env.NODE_ENV === 'production') {
   console.error('Missing NEXT_PUBLIC_RUST_BACKEND_URL - API requests will fail in production');
  }
  return url || 'http://localhost:8080';
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
      console.log(RUST_BACKEND_URL);
    if (!RUST_BACKEND_URL) {
      console.error('RUST_BACKEND_URL is not configured');

      return [];
    }
    
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
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  // Enable detailed logging in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;