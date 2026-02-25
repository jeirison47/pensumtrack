import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@pensumtrack/types', '@pensumtrack/utils'],
}

export default nextConfig
