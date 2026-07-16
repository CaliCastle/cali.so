import type { NextConfig } from 'next'

import legacyUrlManifest from './content/legacy-url-manifest.json'
import { securityHeaders } from './lib/security/headers'

const legacyRedirects = legacyUrlManifest.entries.flatMap((entry) =>
  entry.kind === 'redirect' && typeof entry.destination === 'string'
    ? [
        {
          source: entry.source,
          destination: entry.destination,
          permanent: true,
        },
      ]
    : [],
)

const legacyRewrites = legacyUrlManifest.entries.flatMap((entry) =>
  entry.kind === 'rewrite' && typeof entry.destination === 'string'
    ? [{ source: entry.source, destination: entry.destination }]
    : [],
)

const exposeNavigationTestingApi =
  process.env.NEXT_INSTANT_NAVIGATION_TEST === '1'

const ogRuntimeAssets = [
  './app/_fonts/*.woff2',
  './node_modules/subset-font/**/*',
]

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  // Posts and newsletters are read from the repository at render time. The
  // slug is dynamic, so output tracing cannot discover these files from the
  // readFile calls on its own when packaging serverless functions.
  outputFileTracingIncludes: {
    '/blog/**': ['./content/blog/**/*', ...ogRuntimeAssets],
    '/en/blog/**': ['./content/blog/**/*', ...ogRuntimeAssets],
    '/newsletters/**': ['./content/newsletters/**/*', ...ogRuntimeAssets],
    '/en/newsletters/**': [
      './content/newsletters/**/*',
      ...ogRuntimeAssets,
    ],
    '/content/\\[\\.\\.\\.path\\]': [
      './content/blog/**/*',
      './content/newsletters/**/*',
    ],
  },

  // Pin the project root: when developing from a git worktree nested inside
  // another checkout, Next's lockfile-based root inference walks too far up.
  turbopack: { root: import.meta.dirname },

  // subset-font (OG images) loads harfbuzz wasm from node_modules via fs —
  // bundling breaks the wasm path, so both stay external.
  serverExternalPackages: ['subset-font', 'harfbuzzjs'],

  // Shared-element morphs (cover/title) on route navigation; browsers
  // without the View Transitions API just navigate instantly.
  experimental: {
    authInterrupts: true,
    exposeTestingApiInProductionBuild: exposeNavigationTestingApi,
    viewTransition: true,
    globalNotFound: true,
    sri: { algorithm: 'sha256' },
  },

  images: {
    // Post images are served from content/ via app/content/[...path]/route.ts;
    // site portraits/avatars live in public/images
    localPatterns: [
      { pathname: '/content/**' },
      { pathname: '/images/**' },
      { pathname: '/_next/static/**' },
    ],
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [...securityHeaders],
    },
    {
      // The global policy is intentionally useful for public navigation, but
      // admin API responses must never disclose their origin to another site.
      source: '/api/admin/:path*',
      headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
    },
    {
      // Proxied link media (favicons, Open Graph images) are never a
      // document that may run in this origin. Same-key entries later in
      // this list override the global policy above, so exactly one
      // Content-Security-Policy header is sent.
      source: '/link-media/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'none'; sandbox",
        },
      ],
    },
  ],

  // The checked-in manifest is the v3 cutover contract for every preserved,
  // replaced or retired public URL from the legacy site.
  redirects: async () => legacyRedirects,

  rewrites: async () => legacyRewrites,
}

export default nextConfig
