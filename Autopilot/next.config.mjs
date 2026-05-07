/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
  images: {
    unoptimized: true,
  },
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
