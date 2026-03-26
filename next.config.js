/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure static files are properly generated
  trailingSlash: false,
  // Disable powered by header
  poweredByHeader: false,
}

module.exports = nextConfig;