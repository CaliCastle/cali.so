'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useRouter } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from 'react'

import { Elevated } from '~/lib/elevated'
import { T } from '~/lib/i18n'
import { localize, useLocale } from '~/lib/locale-client'
import {
  ineligibilityReason,
  isMediaAssetEligible,
} from '~/lib/media/asset-review/eligibility'
import type { MediaAssetReviewRecord } from '~/lib/media/asset-review/service'
import type { DraftPhotoSelection } from '~/lib/media/photo-selection/service'
import { tiltFromSlug } from '~/lib/polaroid'

const SAVE_DEBOUNCE_MS = 600

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'conflict'

async function responseJson(response: Response) {
  const body = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : 'request_failed')
  }
  return body
}

function assetName(asset: MediaAssetReviewRecord) {
  return (
    asset.locationLabelEn ||
    asset.locationLabelZhHans ||
    asset.altTextEn ||
    asset.altTextZhHans ||
    asset.id.slice(0, 8)
  )
}

function Print({
  asset,
  index,
}: {
  asset: MediaAssetReviewRecord | undefined
  index: number
}) {
  const focalPoint = asset?.focalPoint ?? { x: 0.5, y: 0.5 }
  return (
    <span
      className="polaroid polaroid-tilted block rounded-[3px] pb-0"
      style={{ '--tilt': `${(tiltFromSlug(asset?.id ?? 'missing') / 2).toFixed(2)}deg` } as React.CSSProperties}
    >
      <span className="polaroid-photo aspect-square overflow-hidden">
        {asset?.previewRendition ? (
          // Bunny is the delivery and cache layer for Renditions.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={asset.previewRendition.src}
            alt=""
            width={asset.previewRendition.width}
            height={asset.previewRendition.height}
            loading="lazy"
            draggable={false}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${focalPoint.x * 100}% ${focalPoint.y * 100}%`,
            }}
          />
        ) : (
          <span className="flex h-full items-center justify-center bg-surface-1 text-sm text-muted-foreground">
            <T zh="成品不可用" en="No Rendition" />
          </span>
        )}
      </span>
      <span className="polaroid-caption justify-between tabular-nums">
        <span>{String(index + 1).padStart(2, '0')}</span>
        {index < 3 && (
          <span aria-hidden className="tracking-[0.08em]">
            <T zh="首页" en="HOME" />
          </span>
        )}
      </span>
    </span>
  )
}

// The curation room: the Photo Selection laid out as the actual prints —
// same tilt and focal crop as the public wall — picked from the archive,
// dragged into order, autosaved as the Draft, and published in one step.
export function PhotoCuration({
  initialDraft,
  assets,
  publishedIds,
}: {
  initialDraft: DraftPhotoSelection
  assets: MediaAssetReviewRecord[]
  publishedIds: string[]
}) {
  const locale = useLocale()
  const router = useRouter()
  const [order, setOrder] = useState(initialDraft.mediaAssetIds)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const orderRef = useRef(order)
  const revisionRef = useRef(initialDraft.revision)
  const saveTimerRef = useRef<number | null>(null)
  const savePromiseRef = useRef<Promise<void> | null>(null)
  const queuedRef = useRef(false)
  const conflictRef = useRef(false)
  const saveFailedRef = useRef(false)
  const publishKeyRef = useRef<string | null>(null)
  const noticeRef = useRef<HTMLParagraphElement>(null)

  const assetById = useMemo(
    () => new Map(assets.map((asset) => [asset.id, asset])),
    [assets],
  )
  const ineligibleIds = order.filter((id) => {
    const asset = assetById.get(id)
    return !asset || !isMediaAssetEligible(asset)
  })
  const candidates = assets.filter((asset) => !order.includes(asset.id))
  const eligibleCandidates = candidates.filter(isMediaAssetEligible)

  useEffect(() => {
    if (notice) noticeRef.current?.focus()
  }, [notice])

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
    },
    [],
  )

  const runSave = useCallback(async () => {
    if (savePromiseRef.current) {
      queuedRef.current = true
      return savePromiseRef.current
    }
    setSaveState('saving')
    const attempt = (async () => {
      try {
        const response = await fetch('/api/admin/media/photo-selection', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            expectedRevision: revisionRef.current,
            mediaAssetIds: orderRef.current,
          }),
        })
        const body = await responseJson(response)
        const draft = body.draft as DraftPhotoSelection
        revisionRef.current = draft.revision
        publishKeyRef.current = null
        saveFailedRef.current = false
        setSaveState('saved')
      } catch (error) {
        const conflicted =
          error instanceof Error && error.message === 'revision_conflict'
        conflictRef.current = conflicted
        saveFailedRef.current = true
        setSaveState(conflicted ? 'conflict' : 'error')
      } finally {
        savePromiseRef.current = null
        if (queuedRef.current) {
          queuedRef.current = false
          void runSave()
        }
      }
    })()
    savePromiseRef.current = attempt
    return attempt
  }, [])

  const applyOrder = useCallback(
    (next: string[]) => {
      orderRef.current = next
      setOrder(next)
      setNotice(null)
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null
        void runSave()
      }, SAVE_DEBOUNCE_MS)
    },
    [runSave],
  )

  async function flushSave() {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
      await runSave()
    }
    // A settling save can launch a queued follow-up from its finally (the
    // new promise is assigned synchronously there), so drain until nothing
    // is in flight — publishing must never race a newer order to the
    // server.
    while (savePromiseRef.current) {
      await savePromiseRef.current
    }
  }

  function moveTo(id: string, destination: number) {
    const from = orderRef.current.indexOf(id)
    if (from < 0) return
    const clamped = Math.max(0, Math.min(orderRef.current.length - 1, destination))
    if (clamped === from) return
    const next = orderRef.current.filter((entry) => entry !== id)
    next.splice(clamped, 0, id)
    applyOrder(next)
  }

  function dropOn(event: DragEvent, index: number) {
    event.preventDefault()
    const id = draggedId
    setDraggedId(null)
    setDropIndex(null)
    if (!id) return
    // The source slides out before insertion, so the drag lands in the
    // marked slot for both forward and backward drops.
    moveTo(id, index)
  }

  async function publish() {
    setPublishing(true)
    setNotice(null)
    try {
      await flushSave()
      // Never publish over an unsaved order: a failed autosave leaves the
      // server's Draft (and its revision) behind the screen, and publishing
      // would silently ship the stale arrangement.
      if (conflictRef.current || saveFailedRef.current) {
        setConfirming(false)
        return
      }
      const idempotencyKey = publishKeyRef.current ?? crypto.randomUUID()
      publishKeyRef.current = idempotencyKey
      const response = await fetch('/api/admin/media/photo-selection/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          expectedDraftRevision: revisionRef.current,
          idempotencyKey,
        }),
      })
      await responseJson(response)
      publishKeyRef.current = null
      setConfirming(false)
      setNotice(
        localize(
          locale,
          `已发布 ${orderRef.current.length} 张照片。`,
          `${orderRef.current.length} photos published.`,
        ),
      )
      router.refresh()
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setNotice(
        code === 'ineligible_assets'
          ? localize(
              locale,
              '选集中有不再符合条件的照片，请移除或到媒体页处理后重试。',
              'The selection holds photos that are no longer eligible. Remove or repair them in Media, then retry.',
            )
          : code === 'revision_conflict'
            ? localize(
                locale,
                '草稿已在其他页面更改，请重新载入。',
                'The Draft changed elsewhere — reload to continue.',
              )
            : code === 'cache_invalidation_failed'
              ? localize(
                  locale,
                  '已发布，但公共缓存尚未刷新；再次发布可安全完成刷新。',
                  'Published, but the public cache did not refresh. Publish again to safely finish.',
                )
              : localize(
                  locale,
                  '无法确认发布状态，可以安全重试。',
                  'Publication could not be confirmed. It is safe to retry.',
                ),
      )
    } finally {
      setPublishing(false)
    }
  }

  const added = order.filter((id) => !publishedIds.includes(id)).length
  const removed = publishedIds.filter((id) => !order.includes(id)).length
  const sameMembership = added === 0 && removed === 0
  const reordered =
    sameMembership &&
    (order.length !== publishedIds.length ||
      order.some((id, index) => publishedIds[index] !== id))
  const selectedIndex = selectedId ? order.indexOf(selectedId) : -1
  const busy = publishing
  const conflict = saveState === 'conflict'

  return (
    <div className="pb-10">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="text-sm font-medium text-muted-foreground">
            <T zh="照片选集" en="Photo Selection" />
          </h1>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            {order.length} <T zh="张照片 · 前三张在首页" en="photos · first three on the homepage" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-sm text-muted-foreground">
            {saveState === 'saving' && <T zh="保存中…" en="Saving…" />}
            {saveState === 'saved' && <T zh="草稿已保存" en="Draft saved" />}
            {saveState === 'error' && (
              <button
                type="button"
                onClick={() => void runSave()}
                className="min-h-11 text-sm underline decoration-dotted underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
              >
                <T zh="保存失败 · 重试" en="Save failed · retry" />
              </button>
            )}
          </span>
          <button
            type="button"
            disabled={
              busy || conflict || saveState === 'error' || ineligibleIds.length > 0
            }
            onClick={() => setConfirming((current) => !current)}
            className="min-h-11 rounded-full bg-foreground px-5 text-sm font-medium text-background outline-none transition-transform duration-100 active:scale-[0.97] disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2 motion-reduce:transform-none"
          >
            <T zh="发布" en="Publish" />
          </button>
        </div>
      </div>

      {conflict && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-1 px-4 py-3">
          <p className="text-sm leading-5">
            <T
              zh="草稿已在其他页面更改。"
              en="The Draft changed in another tab."
            />
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="min-h-11 px-3 text-sm font-medium outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
          >
            <T zh="重新载入草稿" en="Reload draft" />
          </button>
        </div>
      )}

      {confirming && !conflict && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface-1 px-4 py-3">
          <p className="text-sm leading-6">
            {order.length === 0 ? (
              <T
                zh="发布空选集会清空照片页和首页预览。"
                en="Publishing an empty selection clears the photos page and homepage previews."
              />
            ) : (
              <>
                {order.length} <T zh="张照片" en="photos" />
                {added > 0 && (
                  <>
                    {' · '}
                    <T zh={`新增 ${added}`} en={`${added} added`} />
                  </>
                )}
                {removed > 0 && (
                  <>
                    {' · '}
                    <T zh={`移除 ${removed}`} en={`${removed} removed`} />
                  </>
                )}
                {reordered && (
                  <>
                    {' · '}
                    <T zh="顺序有变" en="order changed" />
                  </>
                )}
                {added === 0 && removed === 0 && !reordered && (
                  <>
                    {' · '}
                    <T zh="与线上一致" en="matches what is live" />
                  </>
                )}
              </>
            )}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirming(false)}
              className="min-h-11 px-3 text-sm text-muted-foreground outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
            >
              <T zh="取消" en="Cancel" />
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void publish()}
              className="min-h-11 rounded-full bg-foreground px-4 text-sm font-medium text-background outline-none disabled:opacity-50 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2"
            >
              {publishing ? (
                <T zh="正在发布…" en="Publishing…" />
              ) : (
                <T zh="确认发布" en="Confirm publish" />
              )}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <p
          ref={noticeRef}
          role="status"
          tabIndex={-1}
          className="mt-4 rounded-md bg-surface-1 px-4 py-3 text-sm leading-6 outline-none"
        >
          {notice}
        </p>
      )}

      {ineligibleIds.length > 0 && (
        <p role="alert" className="mt-4 border-l-2 border-destructive pl-4 text-sm leading-6">
          <T
            zh="选集中有照片不再符合发布条件（虚化显示）。移除它，或到媒体页完成处理。"
            en="A photo in the selection is no longer eligible (shown dimmed). Remove it, or repair it in Media."
          />
        </p>
      )}

      {selectedId && selectedIndex >= 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-1 rounded-md bg-surface-1 px-3 py-1.5">
          <span className="px-2 text-sm tabular-nums text-muted-foreground">
            {String(selectedIndex + 1).padStart(2, '0')} / {order.length}
          </span>
          <button
            type="button"
            disabled={busy || selectedIndex === 0}
            onClick={() => moveTo(selectedId, selectedIndex - 1)}
            aria-label={localize(locale, '前移', 'Move earlier')}
            className="min-h-11 min-w-11 text-sm outline-none disabled:opacity-30 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
          >
            ←
          </button>
          <button
            type="button"
            disabled={busy || selectedIndex === order.length - 1}
            onClick={() => moveTo(selectedId, selectedIndex + 1)}
            aria-label={localize(locale, '后移', 'Move later')}
            className="min-h-11 min-w-11 text-sm outline-none disabled:opacity-30 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
          >
            →
          </button>
          <button
            type="button"
            disabled={busy || selectedIndex === 0}
            onClick={() => moveTo(selectedId, 0)}
            className="min-h-11 px-3 text-sm outline-none disabled:opacity-30 focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
          >
            <T zh="移到最前" en="To front" />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              applyOrder(orderRef.current.filter((id) => id !== selectedId))
              setSelectedId(null)
            }}
            className="min-h-11 px-3 text-sm text-muted-foreground outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
          >
            <T zh="移除" en="Remove" />
          </button>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label={localize(locale, '取消选择', 'Deselect')}
            className="min-h-11 min-w-11 text-sm text-muted-foreground outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground"
          >
            ✕
          </button>
        </div>
      )}

      {order.length === 0 ? (
        <p className="mt-6 hairline-top py-10 text-sm leading-6 text-muted-foreground">
          <T
            zh="选集是空的。从档案里挑几张照片开始吧。"
            en="The selection is empty. Pick a few photos from the archive to begin."
          />
        </p>
      ) : null}

      <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6">
        {order.map((id, index) => {
          const asset = assetById.get(id)
          const ineligible = !asset || !isMediaAssetEligible(asset)
          const selected = selectedId === id
          return (
            <li
              key={id}
              onDragOver={(event) => {
                event.preventDefault()
                if (draggedId && draggedId !== id) setDropIndex(index)
              }}
              onDragLeave={() =>
                setDropIndex((current) => (current === index ? null : current))
              }
              onDrop={(event) => dropOn(event, index)}
            >
              <button
                type="button"
                draggable={!busy}
                onDragStart={(event) => {
                  setDraggedId(id)
                  setSelectedId(null)
                  event.dataTransfer.setData('text/plain', id)
                  event.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => {
                  setDraggedId(null)
                  setDropIndex(null)
                }}
                onClick={() => setSelectedId(selected ? null : id)}
                aria-pressed={selected}
                aria-label={localize(
                  locale,
                  `第 ${index + 1} 张：${asset ? assetName(asset) : id.slice(0, 8)}`,
                  `Position ${index + 1}: ${asset ? assetName(asset) : id.slice(0, 8)}`,
                )}
                className={`group block w-full rounded-[4px] outline-none transition-opacity duration-150 ${
                  ineligible ? 'opacity-45' : ''
                } ${draggedId === id ? 'opacity-40' : ''} ${
                  selected || dropIndex === index
                    ? 'ring-1 ring-foreground ring-offset-4 ring-offset-background'
                    : 'focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-background'
                }`}
              >
                <Print asset={asset} index={index} />
              </button>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex aspect-[0.92] w-full items-center justify-center rounded-[4px] border border-dashed border-border text-2xl font-light text-muted-foreground outline-none transition-colors duration-150 hover:border-foreground hover:text-foreground focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2"
            aria-haspopup="dialog"
          >
            <span aria-hidden>+</span>
            <span className="sr-only">
              <T zh="从档案添加照片" en="Add photos from the archive" />
            </span>
          </button>
        </li>
      </ul>

      <Dialog.Root open={pickerOpen} onOpenChange={setPickerOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[var(--z-card)] bg-background/70 backdrop-blur-[6px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
          <Dialog.Popup
            render={<Elevated offset={4} shadowLevel={4} />}
            className="fixed left-1/2 top-1/2 z-[var(--z-card)] max-h-[85dvh] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl p-5 outline-none transition-[opacity,transform] duration-200 ease-[var(--ease-swift)] data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 motion-reduce:transition-none"
          >
            <div className="flex items-baseline justify-between gap-4">
              <Dialog.Title className="text-sm font-medium">
                <T zh="从档案添加" en="Add from the archive" />
              </Dialog.Title>
              <Dialog.Close className="min-h-11 px-2 text-sm text-muted-foreground outline-none focus-visible:rounded-sm focus-visible:ring-1 focus-visible:ring-foreground">
                <T zh="完成" en="Done" />
              </Dialog.Close>
            </div>
            {candidates.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                <T
                  zh="档案里的照片都已经在选集里了。"
                  en="Every archive photo is already in the selection."
                />
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted-foreground">
                  <T zh="点一下即可加入选集末尾。" en="Tap a photo to append it to the selection." />
                </p>
                <ul className="mt-4 grid grid-cols-3 gap-2">
                  {candidates.map((asset) => {
                    const reason = ineligibilityReason(asset)
                    return (
                      <li key={asset.id}>
                        <button
                          type="button"
                          disabled={reason !== null}
                          onClick={() => applyOrder([...orderRef.current, asset.id])}
                          aria-label={assetName(asset)}
                          className="group relative block aspect-square w-full overflow-hidden rounded-md bg-surface-1 outline-none disabled:opacity-40 focus-visible:ring-1 focus-visible:ring-foreground focus-visible:ring-offset-2"
                        >
                          {asset.previewRendition ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={asset.previewRendition.src}
                              alt=""
                              width={asset.previewRendition.width}
                              height={asset.previewRendition.height}
                              loading="lazy"
                              className="h-full w-full object-cover"
                              style={
                                asset.focalPoint
                                  ? {
                                      objectPosition: `${asset.focalPoint.x * 100}% ${asset.focalPoint.y * 100}%`,
                                    }
                                  : undefined
                              }
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center px-2 text-center text-sm text-muted-foreground">
                              <T zh="处理中" en="Processing" />
                            </span>
                          )}
                          {reason !== null && (
                            <span className="absolute inset-x-1 bottom-1 rounded-sm bg-background/85 px-1.5 py-0.5 text-center text-[11px] leading-4">
                              {reason === 'processing' ? (
                                <T zh="处理中" en="Processing" />
                              ) : (
                                <T zh="缺少替代文本" en="Needs Alt Text" />
                              )}
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {eligibleCandidates.length === 0 && (
                  <p className="mt-3 text-sm leading-5 text-muted-foreground">
                    <T
                      zh="没有可加入的照片——去媒体页上传或完成处理。"
                      en="Nothing is ready to add — upload or finish processing in Media."
                    />
                  </p>
                )}
              </>
            )}
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
