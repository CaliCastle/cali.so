import { describe, expect, it } from 'vitest'

import nextConfig from '../next.config'

describe('server output tracing', () => {
  it('packages content and OG dependencies for runtime routes', () => {
    expect(nextConfig.outputFileTracingIncludes).toMatchObject({
      '/blog/**': expect.arrayContaining([
        './content/blog/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/en/blog/**': expect.arrayContaining([
        './content/blog/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/newsletters/**': expect.arrayContaining([
        './content/newsletters/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/en/newsletters/**': expect.arrayContaining([
        './content/newsletters/**/*',
        './app/_fonts/FrexSansGB-OG-*.ttf',
      ]),
      '/content/\\[\\.\\.\\.path\\]': [
        './content/blog/**/*',
        './content/newsletters/**/*',
      ],
    })
  })
})

describe('route security headers', () => {
  it('limits the Fontshare font origin to Cali Baby routes', async () => {
    const rules = await nextConfig.headers!()
    const globalPolicy = rules
      .find(({ source }) => source === '/:path*')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value

    for (const source of ['/calibaby/:path*', '/en/calibaby/:path*']) {
      const policy = rules
        .find((rule) => rule.source === source)
        ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value

      expect(policy).toContain('https://cdn.fontshare.com')
    }

    expect(globalPolicy).not.toContain('fontshare.com')
  })

  it('allows the Google OAuth form redirect only from AMA settings', async () => {
    const rules = await nextConfig.headers!()
    const globalPolicy = rules
      .find(({ source }) => source === '/:path*')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value
    const googleOAuthPolicy = rules
      .find(({ source }) => source === '/admin/ama/settings')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value

    expect(globalPolicy).toContain("form-action 'self'")
    expect(globalPolicy).not.toContain('https://accounts.google.com')
    expect(googleOAuthPolicy).toContain(
      "form-action 'self' https://accounts.google.com",
    )
  })
})
