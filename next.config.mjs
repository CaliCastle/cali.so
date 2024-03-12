/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 * This is especially useful for Docker builds.
 */
!process.env.SKIP_ENV_VALIDATION && (await import('./env.mjs'))

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },

  images: {
    domains: ['cdn.sanity.io'],
  },

  redirects: [
    {
      "source": "/twitter",
      "destination": "https://x.com/thecalicastle",
      "permanent": true
    },
    {
      "source": "/x",
      "destination": "https://x.com/thecalicastle",
      "permanent": true
    },
    {
      "source": "/youtube",
      "destination": "https://youtube.com/@calicastle",
      "permanent": true
    },
    {
      "source": "/tg",
      "destination": "https://t.me/cali_so",
      "permanent": true
    },
    {
      "source": "/linkedin",
      "destination": "https://www.linkedin.com/in/calicastle/",
      "permanent": true
    },
    {
      "source": "/github",
      "destination": "https://github.com/CaliCastle",
      "permanent": true
    },
    {
      "source": "/bilibili",
      "destination": "https://space.bilibili.com/8350251",
      "permanent": true
    }
  ],

  rewrites() {
    return [
      {
        source: '/feed',
        destination: '/feed.xml',
      },
      {
        source: '/rss',
        destination: '/feed.xml',
      },
      {
        source: '/rss.xml',
        destination: '/feed.xml',
      },
    ]
  },
}

export default nextConfig
