import { get } from '@vercel/edge-config'

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import('./env.mjs'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.sanity.io'],
  },

  async redirects() {
    try {
      return (await get('redirects')) ?? []
    } catch {
      return []
    }
  },
}

export default nextConfig
