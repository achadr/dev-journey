import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    resolveAlias: {
      '@': './src',
      '@/tests': './tests',
      '@/content': './content',
    },
  },
}

export default nextConfig
