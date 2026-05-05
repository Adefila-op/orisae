/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'redis', 'bullmq'],
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: process.env.NODE_ENV === 'production' 
            ? '/api/:path*' 
            : 'http://localhost:3001/api/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig
