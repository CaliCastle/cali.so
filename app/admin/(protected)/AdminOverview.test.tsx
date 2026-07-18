// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AdminOverview, type AdminOverviewProps } from './AdminOverview'

afterEach(() => {
  cleanup()
})

const fixtures: AdminOverviewProps = {
  attentionCount: 2,
  nextBooking: {
    id: 'bk_next',
    guestName: 'Ada Lovelace',
    // 02:00Z is 10:00 in the owner zone (Asia/Taipei).
    startsAt: '2026-08-01T02:00:00.000Z',
  },
  newTimeRequestCount: 1,
  mediaActiveCount: 24,
  mediaArchivedCount: 3,
  photosPublishedCount: 9,
  photosDraftCount: 11,
}

function linkWithHref(container: HTMLElement, href: string) {
  return container.querySelector(`a[href="${href}"]`)
}

describe('Admin overview', () => {
  it('renders one catalog row per surface, each linking into it', () => {
    const { container } = render(<AdminOverview {...fixtures} />)
    const text = container.textContent!

    const attentionRow = linkWithHref(container, '/admin/ama')!
    expect(attentionRow).not.toBeNull()
    expect(text).toContain('Needs attention')
    expect(text).toContain('2')

    const nextRow = linkWithHref(container, '/admin/ama/bookings/bk_next')!
    expect(nextRow).not.toBeNull()
    expect(nextRow.textContent).toContain('Ada Lovelace')
    expect(nextRow.textContent).toContain('10:00')

    expect(text).toContain('Time requests')
    expect(text).toContain('1 ')

    const mediaRow = linkWithHref(container, '/admin/media')!
    expect(mediaRow.textContent).toContain('24')
    expect(mediaRow.textContent).toContain('3')

    const photosRow = linkWithHref(container, '/admin/photos')!
    expect(photosRow.textContent).toContain('9')
    expect(photosRow.textContent).toContain('11')
  })

  it('uses destructive ink only when something needs attention', () => {
    const { container } = render(<AdminOverview {...fixtures} />)
    const destructive = container.querySelector('.text-destructive')!
    expect(destructive).not.toBeNull()
    expect(destructive.textContent).toContain('2')
  })

  it('stays quiet when nothing needs a hand', () => {
    const { container } = render(
      <AdminOverview
        {...fixtures}
        attentionCount={0}
        nextBooking={null}
        newTimeRequestCount={0}
        mediaArchivedCount={0}
      />,
    )
    const text = container.textContent!

    expect(container.querySelector('.text-destructive')).toBeNull()
    expect(text).toContain('Nothing scheduled')
    expect(text).not.toContain('archived')
  })

  it('keeps every number tabular and every row inside the quiet list', () => {
    const { container } = render(<AdminOverview {...fixtures} />)

    const rows = Array.from(container.querySelectorAll('ul > li > a'))
    expect(rows.length).toBe(5)
    for (const row of rows) {
      expect(row.querySelector('.tabular-nums')).not.toBeNull()
      expect(row.querySelector('.blog-row-leader')).not.toBeNull()
    }
  })
})
