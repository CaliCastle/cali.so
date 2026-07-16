import { describe, expect, it } from 'vitest'

import nextConfig from '../next.config'

describe('server output tracing', () => {
  it('packages content and OG dependencies for runtime routes', () => {
    expect(nextConfig.outputFileTracingIncludes).toMatchObject({
      '/blog/**': expect.arrayContaining([
        './content/blog/**/*',
        './app/_fonts/*.woff2',
        './node_modules/subset-font/**/*',
      ]),
      '/en/blog/**': expect.arrayContaining([
        './content/blog/**/*',
        './app/_fonts/*.woff2',
        './node_modules/subset-font/**/*',
      ]),
      '/newsletters/**': expect.arrayContaining([
        './content/newsletters/**/*',
        './app/_fonts/*.woff2',
        './node_modules/subset-font/**/*',
      ]),
      '/en/newsletters/**': expect.arrayContaining([
        './content/newsletters/**/*',
        './app/_fonts/*.woff2',
        './node_modules/subset-font/**/*',
      ]),
      '/content/\\[\\.\\.\\.path\\]': [
        './content/blog/**/*',
        './content/newsletters/**/*',
      ],
    })
  })
})
