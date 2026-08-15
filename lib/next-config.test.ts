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
  it('keeps public fonts self-hosted across every route', async () => {
    const rules = await nextConfig.headers!()
    const globalPolicy = rules
      .find(({ source }) => source === '/:path*')
      ?.headers.find(({ key }) => key === 'Content-Security-Policy')?.value

    expect(globalPolicy).toContain("font-src 'self' data:")
    expect(rules).not.toContainEqual(
      expect.objectContaining({ source: '/calibaby/:path*' }),
    )
    expect(rules).not.toContainEqual(
      expect.objectContaining({ source: '/en/calibaby/:path*' }),
    )
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

  it('advertises the root llms.txt from every response', async () => {
    const rules = await nextConfig.headers!()
    const llmsLink = rules
      .find(({ source }) => source === '/:path*')
      ?.headers.find(({ key }) => key === 'Link')?.value

    expect(llmsLink).toBe('</llms.txt>; rel="describedby"')
  })
})
