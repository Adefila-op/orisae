import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'redis', 'bullmq'],
  },
  images: {
    unoptimized: true, // For static export if needed
  },
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
