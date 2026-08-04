const isDevelopment = process.env.NODE_ENV === 'development'

function optionalMediaImageSource() {
  const value = process.env.BUNNY_MEDIA_CDN_URL
  if (!value) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password
      ? ` ${url.origin}`
      : ''
  } catch {
    return ''
  }
}

function optionalClerkSource() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!key) return ''
  const encoded = /^pk_(?:live|test)_([A-Za-z0-9+/=]+)$/.exec(key)?.[1]
  if (!encoded) return ''
  try {
    const domain = atob(encoded).toLowerCase()
    return /^[a-z0-9][a-z0-9.-]*\$$/.test(domain)
      ? ` https://${domain.slice(0, -1)}`
      : ''
  } catch {
    return ''
  }
}

function contentSecurityPolicy(
  scriptSources: string,
  styleSources: string,
  {
    formActionSources = "'self'",
    connectSources = '',
    fontSources = "'self' data:",
  }: {
    formActionSources?: string
    connectSources?: string
    fontSources?: string
  } = {},
) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    `form-action ${formActionSources}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSources}`,
    "script-src-attr 'none'",
    `style-src ${styleSources}`,
    `img-src 'self' data: blob: https://og.zolplay.com${optionalMediaImageSource()}`,
    `font-src ${fontSources}`,
    `connect-src 'self'${connectSources}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "manifest-src 'self'",
  ].join('; ')
}

// Static policies keep the admin's prerendered shell cacheable. Its former
// nonce policy was retired in July 2026: nonces require dynamic rendering,
// which is incompatible with instant navigation.
const publicContentSecurityPolicy = contentSecurityPolicy(
  `'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "'self' 'unsafe-inline'",
)

export const caliBabySecurityHeader = {
  key: 'Content-Security-Policy',
  value: contentSecurityPolicy(
    `'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    "'self' 'unsafe-inline'",
    { fontSources: "'self' data: https://cdn.fontshare.com" },
  ),
} as const

// Admin pages ship clerk-js so the 60-second Clerk session token keeps
// refreshing in the background (July 2026). The script and Frontend API
// origin is derived from the publishable key, which encodes the instance
// domain by Clerk convention, so the policy stays static per build.
const clerkSource = optionalClerkSource()

const adminScriptSources = `'self' 'unsafe-inline'${
  isDevelopment ? " 'unsafe-eval'" : ''
}${clerkSource}`

const adminContentSecurityPolicy = contentSecurityPolicy(
  adminScriptSources,
  "'self' 'unsafe-inline'",
  { connectSources: clerkSource },
)

export const adminSecurityHeader = {
  key: 'Content-Security-Policy',
  value: adminContentSecurityPolicy,
} as const

// The AMA settings page sits under /admin, so it keeps the admin's Clerk
// origins and extends only the form destination for Google OAuth.
const googleOAuthFormContentSecurityPolicy = contentSecurityPolicy(
  adminScriptSources,
  "'self' 'unsafe-inline'",
  {
    formActionSources: "'self' https://accounts.google.com",
    connectSources: clerkSource,
  },
)

export const googleOAuthFormSecurityHeader = {
  key: 'Content-Security-Policy',
  value: googleOAuthFormContentSecurityPolicy,
} as const

export const securityHeaders = [
  { key: 'Content-Security-Policy', value: publicContentSecurityPolicy },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
      'usb=()',
    ].join(', '),
  },
] as const
