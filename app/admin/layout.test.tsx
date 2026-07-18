import { describe, expect, it, vi } from 'vitest'

import { SiteDocument } from '../_components/site-document'
import AdminRootLayout from './layout'

vi.mock('../_components/site-document', () => ({
  rootMetadata: {},
  SiteDocument: vi.fn(),
}))

describe('admin root layout', () => {
  it('renders a static admin document with no client auth provider', () => {
    const children = <div>Admin</div>
    const layout = AdminRootLayout({ children })

    expect(layout.type).toBe(SiteDocument)
    expect(layout.props).toMatchObject({
      children,
      isAdmin: true,
      restoreLocale: true,
    })
  })
})
