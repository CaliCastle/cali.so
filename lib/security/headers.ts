const isDevelopment = process.env.NODE_ENV === 'development'

function optionalMediaImageSource() {
  const value = process.env.BUNNY_RENDITIONS_CDN_URL
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

function contentSecurityPolicy(
  scriptSources: string,
  styleSources: string,
  connectSources = '',
) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src ${scriptSources}`,
    "script-src-attr 'none'",
    `style-src ${styleSources}`,
    `img-src 'self' data: blob: https://og.zolplay.com${optionalMediaImageSource()}`,
    "font-src 'self' data:",
    `connect-src 'self'${connectSources}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "manifest-src 'self'",
  ].join('; ')
}

// One static policy for the whole site. The admin's former per-request
// nonce policy was retired in July 2026: nonces require dynamic rendering,
// which is incompatible with the admin's prerendered instant-navigation
// shells — and with the passkey client removed, no Clerk JS runs in the
// admin, so no provider origins are needed either.
const publicContentSecurityPolicy = contentSecurityPolicy(
  `'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "'self' 'unsafe-inline'",
)

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
