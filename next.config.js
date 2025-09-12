/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["placeholder.svg"],
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/.well-known/farcaster.json",
        destination: "/api/farcaster",
      },
    ]
  },
}

module.exports = nextConfig
