// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MediaLibrary } from '../../../app/admin/(protected)/media/MediaLibrary'
import type { MediaAssetReviewRecord } from '../asset-review/service'

const activeAsset: MediaAssetReviewRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: new Date('2026-07-15T12:00:00.000Z'),
  catalogState: 'active',
  processingState: 'ready',
  width: 4032,
  height: 3024,
  capturedAt: new Date('2025-05-08T00:31:34.000Z'),
  cameraMake: 'Google',
  cameraModel: 'Pixel 9 Pro',
  lens: null,
  focalLengthMillimeters: 6.9,
  aperture: 1.7,
  shutterSpeedSeconds: 0.01,
  iso: 80,
  hasCaptureLocation: true,
  locationLabelZhHans: '旧金山',
  locationLabelEn: 'San Francisco',
  focalPoint: { x: 0.4, y: 0.6 },
  altTextSuggestion: {
    zhHans: '一辆缆车沿着街道行驶。',
    en: 'A cable car travels along a city street.',
    model: 'gateway/model',
    suggestedAt: new Date('2026-07-15T12:00:00.000Z'),
  },
  altTextZhHans: null,
  altTextEn: null,
  altTextApprovedAt: null,
  archivedAt: null,
  previewRendition: {
    src: 'https://media.example.com/renditions/photo-640.jpg',
    width: 640,
    height: 480,
  },
}

beforeEach(() => {
  const entries = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    get length() {
      return entries.size
    },
    clear() {
      entries.clear()
    },
    getItem(key: string) {
      return entries.get(key) ?? null
    },
    removeItem(key: string) {
      entries.delete(key)
    },
    setItem(key: string, value: string) {
      entries.set(key, value)
    },
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  vi.unstubAllGlobals()
  delete document.documentElement.dataset.locale
})

describe('Media archive UI contract', () => {
  it('renders the drop tray, contact sheet, and search without leaking private data', () => {
    const html = renderToStaticMarkup(
      <MediaLibrary
        initialActive={[activeAsset]}
        initialArchived={[]}
        selectionIds={[activeAsset.id]}
      />,
    )

    expect(html).toContain('Drop or choose photos')
    expect(html).toContain('multiple=""')
    expect(html).toContain('image/heic')
    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-haspopup="dialog"')
    // The selection mark shows what the photos page is using.
    expect(html).toContain('In use')
    expect(html).toContain('min-h-11')
    expect(html).not.toMatch(/latitude|longitude|originals\//i)
  })

  it('opens the inspector and supports keyboard Focal Point adjustment', async () => {
    document.documentElement.dataset.locale = 'en'
    const { getByRole } = render(
      <MediaLibrary
        initialActive={[activeAsset]}
        initialArchived={[]}
        selectionIds={[]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /San Francisco/ }))
    const focal = await screen.findByRole('button', { name: /Set Focal Point/ })
    fireEvent.keyDown(focal, { key: 'ArrowRight' })

    await waitFor(() => {
      const marker = focal.querySelector<HTMLSpanElement>('span[style]')
      expect(marker?.style.left).toBe('45%')
    })
  })

  it('keeps manual Location entry available when a file has no GPS metadata', async () => {
    document.documentElement.dataset.locale = 'en'
    const withoutCaptureLocation = {
      ...activeAsset,
      hasCaptureLocation: false,
      locationLabelEn: null,
      locationLabelZhHans: null,
    }
    const { getByRole } = render(
      <MediaLibrary
        initialActive={[withoutCaptureLocation]}
        initialArchived={[]}
        selectionIds={[]}
      />,
    )

    fireEvent.click(
      getByRole('button', { name: /11111111/ }),
    )
    await screen.findByRole('dialog')

    expect(
      screen.queryByRole('button', { name: /Fill from Capture Location/ }),
    ).toBeNull()
    expect(
      (
        screen.getByRole('textbox', {
          name: /Location \(English\)/,
        }) as HTMLInputElement
      ).disabled,
    ).toBe(false)
  })

  it('saves location and alt text edits with one Save action', async () => {
    document.documentElement.dataset.locale = 'en'
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { intent: string }
      return Response.json({
        asset: {
          ...activeAsset,
          ...(body.intent === 'approve_alt_text'
            ? {
                altTextZhHans: '一辆缆车沿着街道行驶。',
                altTextEn: 'A cable car travels along a city street.',
                altTextApprovedAt: new Date().toISOString(),
              }
            : {}),
        },
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const { getByRole } = render(
      <MediaLibrary
        initialActive={[activeAsset]}
        initialArchived={[]}
        selectionIds={[]}
      />,
    )

    fireEvent.click(getByRole('button', { name: /San Francisco/ }))
    await screen.findByRole('dialog')
    fireEvent.change(screen.getByRole('textbox', { name: /Location \(English\)/ }), {
      target: { value: 'San Francisco, CA' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Save/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    const intents = fetchMock.mock.calls.map(
      ([, init]) => (JSON.parse(String(init?.body)) as { intent: string }).intent,
    )
    // Both halves changed (location edited; alt text prefilled from the
    // suggestion but not yet approved), one Save sends both.
    expect(intents).toEqual(['update_display_metadata', 'approve_alt_text'])
  })

  it('purges only through the typed in-dialog confirmation', async () => {
    document.documentElement.dataset.locale = 'en'
    const archivedAsset: MediaAssetReviewRecord = {
      ...activeAsset,
      catalogState: 'archived',
      archivedAt: new Date('2026-07-15T13:00:00.000Z'),
    }
    const fetchMock = vi.fn(async () => Response.json({ result: { purged: true } }))
    vi.stubGlobal('fetch', fetchMock)
    const { getByRole } = render(
      <MediaLibrary
        initialActive={[]}
        initialArchived={[archivedAsset]}
        selectionIds={[]}
      />,
    )

    fireEvent.click(getByRole('tab', { name: /Archived/ }))
    fireEvent.click(getByRole('button', { name: /San Francisco/ }))
    await screen.findByRole('dialog')
    fireEvent.click(screen.getByRole('button', { name: /Purge$/ }))

    const confirmButton = screen.getByRole('button', {
      name: /Confirm purge/,
    }) as HTMLButtonElement
    const input = screen.getByRole('textbox', { name: /Type PURGE to confirm/ })

    fireEvent.change(input, { target: { value: 'purge' } })
    expect(confirmButton.disabled).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'PURGE' } })
    expect(confirmButton.disabled).toBe(false)
    fireEvent.click(confirmButton)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/admin/media/assets/${activeAsset.id}/purge`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ confirmation: 'PURGE' }),
      }),
    )
  })

  it('retries a failed Original transfer before attempting completion', async () => {
    const digest = new Uint8Array(32).buffer
    vi.stubGlobal('crypto', {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
        .mockReturnValueOnce('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
      subtle: { digest: vi.fn().mockResolvedValue(digest) },
    })

    let originalAttempts = 0
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, _init?: RequestInit) => {
        const url = String(input)
        if (url === '/api/admin/media/upload-intents') {
          return Response.json(
            {
              uploadIntent: {
                id: '22222222-2222-4222-8222-222222222222',
              },
            },
            { status: 201 },
          )
        }
        if (url.endsWith('/original')) {
          originalAttempts += 1
          return new Response(null, {
            status: originalAttempts === 1 ? 503 : 204,
          })
        }
        if (url.endsWith('/complete')) {
          return Response.json({
            mediaAsset: { id: activeAsset.id, processingState: 'ready' },
          })
        }
        if (url.endsWith('/alt-text')) {
          return Response.json({ suggestion: null, asset: null })
        }
        if (url.endsWith('?view=active')) {
          return Response.json({ assets: [activeAsset] })
        }
        if (url.endsWith('?view=archived')) {
          return Response.json({ assets: [] })
        }
        throw new Error(`Unexpected request: ${url}`)
      },
    )
    vi.stubGlobal('fetch', fetchMock)

    const { container, getByRole } = render(
      <MediaLibrary initialActive={[]} initialArchived={[]} selectionIds={[]} />,
    )
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', {
      type: 'image/jpeg',
    })
    if (!file.arrayBuffer) {
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => new Uint8Array([1, 2, 3]).buffer,
      })
    }
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })

    await waitFor(() => expect(getByRole('button', { name: /Retry/ })).toBeTruthy())
    fireEvent.click(getByRole('button', { name: /Retry/ }))
    await waitFor(() => {
      expect(originalAttempts).toBe(2)
      expect(
        fetchMock.mock.calls.some(([input]) => String(input).endsWith('/complete')),
      ).toBe(true)
    })

    const urls = fetchMock.mock.calls.map(([input]) => String(input))
    expect(urls.filter((url) => url === '/api/admin/media/upload-intents')).toHaveLength(1)
    expect(urls.filter((url) => url.endsWith('/original'))).toHaveLength(2)
    expect(urls.filter((url) => url.endsWith('/complete'))).toHaveLength(1)
    // The auto-approve request follows completion without user action.
    expect(urls.some((url) => url.endsWith('/alt-text'))).toBe(true)
    const intentBody = JSON.parse(
      String(
        fetchMock.mock.calls.find(([input]) =>
          String(input).endsWith('/upload-intents'),
        )?.[1]?.body,
      ),
    ) as { idempotencyKey: string }
    expect(intentBody.idempotencyKey).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
    expect(localStorage.length).toBe(0)
  })

  it('reuses an unfinished upload key after the admin remounts', async () => {
    const digest = new Uint8Array(32).buffer
    vi.stubGlobal('crypto', {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
        .mockReturnValueOnce('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
        .mockReturnValueOnce('cccccccc-cccc-4ccc-8ccc-cccccccccccc'),
      subtle: { digest: vi.fn().mockResolvedValue(digest) },
    })
    const intentBodies: Array<{ idempotencyKey: string }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        intentBodies.push(JSON.parse(String(init?.body)))
        return Response.json({ error: 'dependency_unavailable' }, { status: 503 })
      }),
    )
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', {
      type: 'image/jpeg',
    })
    if (!file.arrayBuffer) {
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => new Uint8Array([1, 2, 3]).buffer,
      })
    }

    const first = render(
      <MediaLibrary initialActive={[]} initialArchived={[]} selectionIds={[]} />,
    )
    fireEvent.change(first.container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })
    await waitFor(() => expect(intentBodies).toHaveLength(1))
    first.unmount()

    const second = render(
      <MediaLibrary initialActive={[]} initialArchived={[]} selectionIds={[]} />,
    )
    fireEvent.change(second.container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })
    await waitFor(() => expect(intentBodies).toHaveLength(2))
    expect(intentBodies.map(({ idempotencyKey }) => idempotencyKey)).toEqual([
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ])
  })

  it('keeps a completed upload archived when the library refresh fails', async () => {
    document.documentElement.dataset.locale = 'en'
    const digest = new Uint8Array(32).buffer
    vi.stubGlobal('crypto', {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
        .mockReturnValueOnce('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
      subtle: { digest: vi.fn().mockResolvedValue(digest) },
    })

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/admin/media/upload-intents') {
        return Response.json({
          uploadIntent: { id: '22222222-2222-4222-8222-222222222222' },
        })
      }
      if (url.endsWith('/original')) return new Response(null, { status: 204 })
      if (url.endsWith('/complete')) {
        return Response.json({
          mediaAsset: { id: activeAsset.id, processingState: 'ready' },
        })
      }
      if (url.endsWith('/alt-text')) {
        return Response.json({ suggestion: null, asset: null })
      }
      if (url.includes('/api/admin/media/assets?view=')) {
        return Response.json({ error: 'dependency_unavailable' }, { status: 503 })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const { container, getByText, queryByRole } = render(
      <MediaLibrary initialActive={[]} initialArchived={[]} selectionIds={[]} />,
    )
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.jpg', {
      type: 'image/jpeg',
    })
    if (!file.arrayBuffer) {
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => new Uint8Array([1, 2, 3]).buffer,
      })
    }
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    })

    await waitFor(() => expect(getByText('In the archive')).toBeTruthy())
    expect(queryByRole('button', { name: /Retry/ })).toBeNull()
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input).endsWith('/complete')),
    ).toHaveLength(1)
  })
})
