import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      resolveAlias: {
        '@': './src',
        '@/tests': './tests',
        '@/content': './content',
      },
    },
  },
}

export default nextConfig
