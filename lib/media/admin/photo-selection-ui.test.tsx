// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const refresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => '/admin/photos',
}))

import { PhotoCuration } from '../../../app/admin/(protected)/photos/PhotoCuration'
import type { MediaAssetReviewRecord } from '../asset-review/service'

function asset(id: string, name: string): MediaAssetReviewRecord {
  return {
    id,
    createdAt: new Date('2026-07-15T12:00:00.000Z'),
    catalogState: 'active',
    processingState: 'ready',
    width: 1600,
    height: 1200,
    capturedAt: null,
    cameraMake: null,
    cameraModel: null,
    lens: null,
    focalLengthMillimeters: null,
    aperture: null,
    shutterSpeedSeconds: null,
    iso: null,
    hasCaptureLocation: false,
    locationLabelZhHans: null,
    locationLabelEn: name,
    focalPoint: { x: 0.4, y: 0.6 },
    altTextSuggestion: null,
    altTextZhHans: `${name} 的照片`,
    altTextEn: `A photo of ${name}`,
    altTextApprovedAt: new Date('2026-07-15T12:30:00.000Z'),
    archivedAt: null,
    previewRendition: {
      src: `https://media.example.com/renditions/${id}-640.jpg`,
      width: 640,
      height: 480,
    },
  }
}

const one = asset('11111111-1111-4111-8111-111111111111', 'Pier 7')
const two = asset('22222222-2222-4222-8222-222222222222', 'Chinatown')
const three = asset('33333333-3333-4333-8333-333333333333', 'Twin Peaks')
const four = asset('44444444-4444-4444-8444-444444444444', 'Ocean Beach')
const processing: MediaAssetReviewRecord = {
  ...asset('55555555-5555-4555-8555-555555555555', 'Presidio'),
  processingState: 'processing',
  previewRendition: null,
  altTextApprovedAt: null,
}

const allAssets = [one, two, three, four, processing]

function draft(ids: string[], revision = 3) {
  return { revision, mediaAssetIds: ids, updatedAt: new Date('2026-07-15T13:00:00.000Z') }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  refresh.mockClear()
  delete document.documentElement.dataset.locale
})

describe('Photo curation UI contract', () => {
  it('renders the selection as ordered prints with the homepage trio marked', () => {
    const html = renderToStaticMarkup(
      <PhotoCuration
        initialDraft={draft([one.id, two.id, three.id, four.id])}
        assets={allAssets}
        publishedIds={[one.id, two.id, three.id, four.id]}
      />,
    )

    expect(html).toContain('01')
    expect(html).toContain('04')
    // Exactly the first three prints carry the homepage mark.
    expect(html.match(/HOME/g)).toHaveLength(3)
    expect(html).toContain('polaroid')
    expect(html).toContain('Publish')
    expect(html).toContain('Add photos from the archive')
    expect(html).not.toMatch(/latitude|longitude|originals\//i)
  })

  it('reorders through the toolbar and coalesces changes into one autosave', async () => {
    document.documentElement.dataset.locale = 'en'
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { mediaAssetIds: string[] }
      return Response.json({ draft: draft(body.mediaAssetIds, 4) })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { getByRole } = render(
      <PhotoCuration
        initialDraft={draft([one.id, two.id, three.id])}
        assets={allAssets}
        publishedIds={[]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /Position 3: Twin Peaks/ }))
    const earlier = getByRole('button', { name: /Move earlier/ })
    fireEvent.click(earlier)
    fireEvent.click(earlier)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/media/photo-selection',
      expect.objectContaining({ method: 'PUT' }),
    )
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      expectedRevision: 3,
      mediaAssetIds: [three.id, one.id, two.id],
    })
  })

  it('appends eligible archive photos from the picker and blocks unready ones', async () => {
    document.documentElement.dataset.locale = 'en'
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { mediaAssetIds: string[] }
      return Response.json({ draft: draft(body.mediaAssetIds, 4) })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { getByRole } = render(
      <PhotoCuration
        initialDraft={draft([one.id])}
        assets={allAssets}
        publishedIds={[one.id]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /Add photos from the archive/ }))
    await screen.findByRole('dialog')

    const unready = screen.getByRole('button', {
      name: /Presidio/,
    }) as HTMLButtonElement
    expect(unready.disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /Ocean Beach/ }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      expectedRevision: 3,
      mediaAssetIds: [one.id, four.id],
    })
  })

  it('publishes after an inline confirmation that summarizes the change', async () => {
    document.documentElement.dataset.locale = 'en'
    const calls: Array<{ url: string; body: Record<string, unknown> }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        calls.push({ url, body: JSON.parse(String(init?.body)) })
        if (url.endsWith('/publish')) {
          return Response.json({
            result: { status: 'published', itemCount: 2 },
          })
        }
        return Response.json({ draft: draft([], 4) })
      }),
    )
    const { getByRole, getByText } = render(
      <PhotoCuration
        initialDraft={draft([one.id, two.id])}
        assets={allAssets}
        publishedIds={[one.id]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /Publish/ }))
    expect(getByText(/1 added/)).toBeTruthy()

    fireEvent.click(getByRole('button', { name: /Confirm publish/ }))
    await waitFor(() =>
      expect(calls.some((call) => call.url.endsWith('/publish'))).toBe(true),
    )
    const publish = calls.find((call) => call.url.endsWith('/publish'))!
    expect(publish.body.expectedDraftRevision).toBe(3)
    expect(typeof publish.body.idempotencyKey).toBe('string')
    await waitFor(() => expect(getByText(/photos published/)).toBeTruthy())
    expect(refresh).toHaveBeenCalled()
  })

  it('flushes a pending reorder before publishing with the new revision', async () => {
    document.documentElement.dataset.locale = 'en'
    const calls: Array<{ url: string; body: Record<string, unknown> }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        const body = JSON.parse(String(init?.body)) as Record<string, unknown>
        calls.push({ url, body })
        if (url.endsWith('/publish')) {
          return Response.json({ result: { status: 'published' } })
        }
        return Response.json({
          draft: draft(body.mediaAssetIds as string[], 9),
        })
      }),
    )
    const { getByRole } = render(
      <PhotoCuration
        initialDraft={draft([one.id, two.id])}
        assets={allAssets}
        publishedIds={[]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /Position 2: Chinatown/ }))
    fireEvent.click(getByRole('button', { name: /Move earlier/ }))
    fireEvent.click(getByRole('button', { name: /Publish/ }))
    fireEvent.click(getByRole('button', { name: /Confirm publish/ }))

    await waitFor(() =>
      expect(calls.some((call) => call.url.endsWith('/publish'))).toBe(true),
    )
    expect(calls[0]!.url).toBe('/api/admin/media/photo-selection')
    expect(calls[0]!.body.mediaAssetIds).toEqual([two.id, one.id])
    const publish = calls.find((call) => call.url.endsWith('/publish'))!
    expect(publish.body.expectedDraftRevision).toBe(9)
  })

  it('recovers from a revision conflict by reloading the draft in place', async () => {
    document.documentElement.dataset.locale = 'en'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ error: 'revision_conflict' }, { status: 409 }),
      ),
    )
    const { getByRole, findByRole } = render(
      <PhotoCuration
        initialDraft={draft([one.id, two.id])}
        assets={allAssets}
        publishedIds={[]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /Position 2: Chinatown/ }))
    fireEvent.click(getByRole('button', { name: /Move earlier/ }))

    const reload = await findByRole('button', { name: /Reload draft/ })
    expect(
      (getByRole('button', { name: /Publish/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    fireEvent.click(reload)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it('keeps the publish idempotency key across a failed retry', async () => {
    document.documentElement.dataset.locale = 'en'
    const publishBodies: Array<{ idempotencyKey: string }> = []
    let attempts = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.endsWith('/publish')) {
          publishBodies.push(JSON.parse(String(init?.body)))
          attempts += 1
          if (attempts === 1) {
            return Response.json({ error: 'dependency_unavailable' }, { status: 503 })
          }
          return Response.json({ result: { status: 'published' } })
        }
        throw new Error(`Unexpected request: ${url}`)
      }),
    )
    const { getByRole, findByText } = render(
      <PhotoCuration
        initialDraft={draft([one.id])}
        assets={allAssets}
        publishedIds={[one.id]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /Publish/ }))
    fireEvent.click(getByRole('button', { name: /Confirm publish/ }))
    await findByText(/safe to retry/)

    // The confirmation panel stays open after a failure — retry directly.
    fireEvent.click(getByRole('button', { name: /Confirm publish/ }))
    await waitFor(() => expect(publishBodies).toHaveLength(2))
    expect(publishBodies[0]!.idempotencyKey).toBe(publishBodies[1]!.idempotencyKey)
  })
})
