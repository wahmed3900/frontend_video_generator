import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images served from your Cloud Run backend
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.run.app',
      },
    ],
  },
};

export default nextConfig;
