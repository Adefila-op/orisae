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
  async rewrites() {
    const localApiOrigin = process.env.LOCAL_API_ORIGIN || 'http://localhost:3001'
    const remoteApiOrigin = process.env.API_ORIGIN || process.env.NEXT_PUBLIC_API_ORIGIN

    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: '/api/:path*',
          destination: `${localApiOrigin}/api/:path*`,
        },
      ]
    }

    if (remoteApiOrigin) {
      return [
        {
          source: '/api/:path*',
          destination: `${remoteApiOrigin.replace(/\/$/, '')}/api/:path*`,
        },
      ]
    }

    return []
  },
}

export default nextConfig
