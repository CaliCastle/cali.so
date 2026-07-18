import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('~/components/admin-dock', () => ({
  AdminDock: () => <span data-admin-dock="" />,
  AdminDockFallback: () => <span data-admin-dock-fallback="" />,
}))

import { AdminShell } from './AdminShell'

describe('AdminShell', () => {
  it('centers content in the site column with the owner dock', () => {
    const html = renderToStaticMarkup(
      <AdminShell>
        <section>Media content</section>
      </AdminShell>,
    )

    expect(html).toContain('max-w-[37.5rem]')
    expect(html).toContain('Media content')
    expect(html).toContain('data-admin-dock')
  })
})
