import 'server-only'

import type {
  OwnerAccess,
  OwnerPrincipal,
} from '~/lib/admin/authorization'
import type { AmaSecurity, PrivilegedAuditEvent } from '~/lib/ama/security/service'

import { MediaAltTextError } from '../alt-text/service'
import { MediaAssetReviewError } from '../asset-review/service'
import {
  MediaIngestionError,
  type OriginalContentType,
} from '../ingestion/service'
import { MediaGeocodingError } from '../geocoding/service'
import { MediaPurgeError } from '../purge/service'
import { MediaReconciliationError } from '../reconciliation/service'
import { PhotoSelectionError } from '../photo-selection/service'
import { storeOriginalFromSameOriginRequest } from '../storage/upload'

type Authenticator = {
  authenticate(request: Request): Promise<OwnerAccess>
}

type Security = Pick<
  AmaSecurity,
  | 'limitAdminMutation'
  | 'protectOwnerAdminMutation'
  | 'recordAuthenticationDenial'
  | 'recordPrivilegedAction'
>

type BaseDependencies = {
  authenticator: Authenticator
  security: Security
}

type AccessResult =
  | { response: Response }
  | { principal: OwnerPrincipal }

const responseHeaders = {
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders })
}

function errorResponse(error: unknown) {
  const code =
    error instanceof MediaAssetReviewError ||
    error instanceof MediaIngestionError ||
    error instanceof MediaGeocodingError ||
    error instanceof MediaAltTextError ||
    error instanceof MediaPurgeError ||
    error instanceof MediaReconciliationError ||
    error instanceof PhotoSelectionError
      ? error.code
      : 'dependency_unavailable'
  const status =
    code === 'invalid_request'
      ? 400
      : code === 'not_found'
        ? 404
        : code === 'no_capture_location' || code === 'no_results'
          ? 422
          : code === 'rate_limited'
            ? 429
            : code === 'dependency_unavailable' ||
                code === 'generation_failed' ||
                code === 'cache_invalidation_failed'
              ? 503
              : 409
  return json(status, { error: code })
}

export function createPhotoSelectionDraftHandler(
  dependencies: BaseDependencies & {
    selection: {
      saveDraft(input: {
        ownerUserId: string
        expectedRevision: number
        mediaAssetIds: string[]
      }): Promise<unknown>
    }
  },
) {
  return async function PUT(request: Request) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    try {
      const body = await requestJson(request)
      if (
        !Array.isArray(body.mediaAssetIds) ||
        body.mediaAssetIds.some(
          (mediaAssetId) => typeof mediaAssetId !== 'string',
        )
      ) {
        throw new PhotoSelectionError('invalid_request')
      }
      const draft = await dependencies.selection.saveDraft({
        ownerUserId: access.principal.id,
        expectedRevision:
          typeof body.expectedRevision === 'number'
            ? body.expectedRevision
            : Number.NaN,
        mediaAssetIds: body.mediaAssetIds as string[],
      })
      audit(
        dependencies,
        request,
        'media_photo_selection.draft_saved',
        access.principal.actorId,
      )
      return json(200, { draft })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function createPhotoSelectionPublishHandler(
  dependencies: BaseDependencies & {
    selection: {
      publish(input: {
        ownerUserId: string
        expectedDraftRevision: number
        idempotencyKey: string
      }): Promise<unknown>
    }
  },
) {
  return async function POST(request: Request) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    try {
      const body = await requestJson(request)
      const publication = await dependencies.selection.publish({
        ownerUserId: access.principal.id,
        expectedDraftRevision:
          typeof body.expectedDraftRevision === 'number'
            ? body.expectedDraftRevision
            : Number.NaN,
        idempotencyKey:
          typeof body.idempotencyKey === 'string' ? body.idempotencyKey : '',
      })
      audit(
        dependencies,
        request,
        'media_photo_selection.published',
        access.principal.actorId,
      )
      return json(200, { publication })
    } catch (error) {
      if (
        error instanceof PhotoSelectionError &&
        error.code === 'cache_invalidation_failed'
      ) {
        // The immutable publication committed before cache invalidation ran.
        audit(
          dependencies,
          request,
          'media_photo_selection.published',
          access.principal.actorId,
        )
      }
      return errorResponse(error)
    }
  }
}

async function authenticate(
  dependencies: BaseDependencies,
  request: Request,
  mutation: boolean,
): Promise<AccessResult> {
  const blocked = mutation
    ? await dependencies.security.protectOwnerAdminMutation(request)
    : null
  if (blocked) return { response: blocked }

  let access: OwnerAccess
  try {
    access = await dependencies.authenticator.authenticate(request)
  } catch {
    return { response: json(503, { error: 'dependency_unavailable' }) }
  }
  if (access.status !== 'authorized') {
    dependencies.security.recordAuthenticationDenial(request)
    return {
      response: json(
        access.status === 'forbidden' ? 403 : 401,
        { error: access.status === 'forbidden' ? 'forbidden' : 'unauthorized' },
      ),
    }
  }
  if (mutation) {
    const limited = await dependencies.security.limitAdminMutation(
      request,
      access.principal.actorId,
    )
    if (limited) return { response: limited }
  }
  return { principal: access.principal }
}

async function requestJson(request: Request) {
  if (request.headers.get('content-type')?.split(';', 1)[0] !== 'application/json') {
    throw new MediaAssetReviewError('invalid_request')
  }
  const contentLength = request.headers.get('content-length')
  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > 32_768)
  ) {
    throw new MediaAssetReviewError('invalid_request')
  }
  try {
    const reader = request.body?.getReader()
    if (!reader) throw new MediaAssetReviewError('invalid_request')
    const chunks: Uint8Array[] = []
    let byteLength = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      byteLength += value.byteLength
      if (byteLength > 32_768) {
        await reader.cancel().catch(() => undefined)
        throw new MediaAssetReviewError('invalid_request')
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(byteLength)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new MediaAssetReviewError('invalid_request')
    }
    return body as Record<string, unknown>
  } catch (error) {
    if (error instanceof MediaAssetReviewError) throw error
    throw new MediaAssetReviewError('invalid_request')
  }
}

function audit(
  dependencies: BaseDependencies,
  request: Request,
  event: PrivilegedAuditEvent,
  actorId: string,
) {
  dependencies.security.recordPrivilegedAction(request, event, actorId)
}

export function createMediaAssetListHandler(
  dependencies: BaseDependencies & {
    review: {
      listAssets(input: {
        ownerUserId: string
        view: 'active' | 'archived'
      }): Promise<unknown>
    }
  },
) {
  return async function GET(request: Request) {
    const access = await authenticate(dependencies, request, false)
    if ('response' in access) return access.response
    const view = new URL(request.url).searchParams.get('view')
    if (view !== 'active' && view !== 'archived') {
      return json(400, { error: 'invalid_request' })
    }
    try {
      const assets = await dependencies.review.listAssets({
        ownerUserId: access.principal.id,
        view,
      })
      return json(200, { assets })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function createMediaAssetActionHandler(
  dependencies: BaseDependencies & {
    review: {
      updateDisplayMetadata(input: Record<string, unknown>): Promise<unknown>
      approveAltText(input: Record<string, unknown>): Promise<unknown>
      archive(input: { ownerUserId: string; mediaAssetId: string }): Promise<unknown>
      restore(input: { ownerUserId: string; mediaAssetId: string }): Promise<unknown>
    }
  },
) {
  return async function POST(request: Request, mediaAssetId: string) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    try {
      const body = await requestJson(request)
      const common = { ownerUserId: access.principal.id, mediaAssetId }
      let asset: unknown
      let event: PrivilegedAuditEvent
      if (body.intent === 'update_display_metadata') {
        asset = await dependencies.review.updateDisplayMetadata({
          ...common,
          locationLabelZhHans: body.locationLabelZhHans,
          locationLabelEn: body.locationLabelEn,
          focalPoint: body.focalPoint,
        })
        event = 'media_asset.reviewed'
      } else if (body.intent === 'approve_alt_text') {
        asset = await dependencies.review.approveAltText({
          ...common,
          zhHans: body.zhHans,
          en: body.en,
        })
        event = 'media_asset.reviewed'
      } else if (body.intent === 'archive') {
        asset = await dependencies.review.archive(common)
        event = 'media_asset.archived'
      } else if (body.intent === 'restore') {
        asset = await dependencies.review.restore(common)
        event = 'media_asset.restored'
      } else {
        return json(400, { error: 'invalid_request' })
      }
      audit(dependencies, request, event, access.principal.actorId)
      return json(200, { asset })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function createMediaAltTextHandler(
  dependencies: BaseDependencies & {
    altText: {
      generateSuggestion(input: {
        ownerUserId: string
        mediaAssetId: string
      }): Promise<unknown>
    }
    review: {
      getAsset(input: {
        ownerUserId: string
        mediaAssetId: string
      }): Promise<{ altTextApprovedAt: Date | null }>
      approveAltText(input: Record<string, unknown>): Promise<unknown>
    }
  },
) {
  return async function POST(request: Request, mediaAssetId: string) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    try {
      const suggestion = (await dependencies.altText.generateSuggestion({
        ownerUserId: access.principal.id,
        mediaAssetId,
      })) as { zhHans: string; en: string }
      audit(
        dependencies,
        request,
        'media_alt_text.requested',
        access.principal.actorId,
      )

      // Auto-approval (maintainer decision, July 2026): a fresh suggestion
      // becomes the approved bilingual Alt Text whenever none exists yet,
      // so upload-to-archive needs no separate review step. Existing
      // approved text is never overwritten — regenerating only updates the
      // suggestion, and edits go through approve_alt_text as before.
      let asset: unknown = null
      let autoApprovalFailed = false
      try {
        const common = { ownerUserId: access.principal.id, mediaAssetId }
        const current = await dependencies.review.getAsset(common)
        if (current.altTextApprovedAt === null) {
          asset = await dependencies.review.approveAltText({
            ...common,
            zhHans: suggestion.zhHans,
            en: suggestion.en,
          })
          audit(
            dependencies,
            request,
            'media_asset.reviewed',
            access.principal.actorId,
          )
        } else {
          asset = current
        }
      } catch {
        // The suggestion still stands on its own; the flag lets the UI say
        // the photo needs a save in the inspector before it can publish.
        autoApprovalFailed = true
      }

      return json(200, {
        suggestion,
        asset,
        ...(autoApprovalFailed ? { autoApprovalFailed: true } : {}),
      })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function createMediaLocationLabelHandler(
  dependencies: BaseDependencies & {
    geocoding: {
      suggestLocationLabel(input: {
        ownerUserId: string
        mediaAssetId: string
      }): Promise<unknown>
    } | null
  },
) {
  return async function POST(request: Request, mediaAssetId: string) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    if (!dependencies.geocoding) {
      return json(503, { error: 'provider_not_configured' })
    }
    audit(
      dependencies,
      request,
      'media_location_label.requested',
      access.principal.actorId,
    )
    try {
      const suggestion = await dependencies.geocoding.suggestLocationLabel({
        ownerUserId: access.principal.id,
        mediaAssetId,
      })
      return json(200, { suggestion })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function createMediaResumeHandler(
  dependencies: BaseDependencies & {
    reconciliation: {
      resumeMediaAsset(input: {
        ownerUserId: string
        mediaAssetId: string
      }): Promise<unknown>
    }
    review: {
      getAsset(input: {
        ownerUserId: string
        mediaAssetId: string
      }): Promise<unknown>
    }
  },
) {
  return async function POST(request: Request, mediaAssetId: string) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    try {
      const identity = {
        ownerUserId: access.principal.id,
        mediaAssetId,
      }
      await dependencies.reconciliation.resumeMediaAsset(identity)
      const asset = await dependencies.review.getAsset(identity)
      audit(
        dependencies,
        request,
        'media_asset.processing_resumed',
        access.principal.actorId,
      )
      return json(200, { asset })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function createMediaPurgeHandler(
  dependencies: BaseDependencies & {
    purge: {
      getStatus(input: {
        ownerUserId: string
        mediaAssetId: string
      }): Promise<unknown>
      purge(input: {
        ownerUserId: string
        mediaAssetId: string
        confirmation: string
      }): Promise<unknown>
    }
  },
) {
  return {
    async GET(request: Request, mediaAssetId: string) {
      const access = await authenticate(dependencies, request, false)
      if ('response' in access) return access.response
      try {
        const status = await dependencies.purge.getStatus({
          ownerUserId: access.principal.id,
          mediaAssetId,
        })
        return json(200, { status })
      } catch (error) {
        return errorResponse(error)
      }
    },
    async POST(request: Request, mediaAssetId: string) {
      const access = await authenticate(dependencies, request, true)
      if ('response' in access) return access.response
      try {
        const body = await requestJson(request)
        const result = await dependencies.purge.purge({
          ownerUserId: access.principal.id,
          mediaAssetId,
          confirmation:
            typeof body.confirmation === 'string' ? body.confirmation : '',
        })
        audit(
          dependencies,
          request,
          'media_asset.purge_requested',
          access.principal.actorId,
        )
        return json(200, { result })
      } catch (error) {
        return errorResponse(error)
      }
    },
  }
}

export function createMediaUploadIntentHandler(
  dependencies: BaseDependencies & {
    ingestion: {
      createUploadIntent(input: {
        ownerUserId: string
        idempotencyKey: string
        contentType: OriginalContentType
        byteSize: number
        checksumSha256: string
      }): Promise<{ id: string; expiresAt: Date }>
    }
  },
) {
  return async function POST(request: Request) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    try {
      const body = await requestJson(request)
      const intent = await dependencies.ingestion.createUploadIntent({
        ownerUserId: access.principal.id,
        idempotencyKey:
          typeof body.idempotencyKey === 'string' ? body.idempotencyKey : '',
        contentType: body.contentType as OriginalContentType,
        byteSize: typeof body.byteSize === 'number' ? body.byteSize : 0,
        checksumSha256:
          typeof body.checksumSha256 === 'string' ? body.checksumSha256 : '',
      })
      audit(
        dependencies,
        request,
        'media_upload.intent_created',
        access.principal.actorId,
      )
      return json(201, {
        uploadIntent: {
          id: intent.id,
          expiresAt: intent.expiresAt,
          uploadUrl: `/api/admin/media/upload-intents/${intent.id}/original`,
        },
      })
    } catch (error) {
      return errorResponse(error)
    }
  }
}

export function createMediaOriginalUploadHandler(
  dependencies: BaseDependencies & {
    baseUrl: URL
    ingestionRepository: {
      findUploadIntent(
        ownerUserId: string,
        id: string,
      ): Promise<{
        originalKey: string
        contentType: string
        byteSize: number
        checksumSha256: string
      } | null>
    }
    storage: Parameters<typeof storeOriginalFromSameOriginRequest>[0]['storage']
  },
) {
  return async function PUT(request: Request, uploadIntentId: string) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    let intent: Awaited<
      ReturnType<
        typeof dependencies.ingestionRepository.findUploadIntent
      >
    >
    try {
      intent = await dependencies.ingestionRepository.findUploadIntent(
        access.principal.id,
        uploadIntentId,
      )
    } catch {
      return json(503, { error: 'dependency_unavailable' })
    }
    if (!intent) return json(404, { error: 'not_found' })
    return storeOriginalFromSameOriginRequest({
      request,
      canonicalBaseUrl: dependencies.baseUrl,
      expectation: {
        key: intent.originalKey,
        contentType: intent.contentType,
        byteSize: intent.byteSize,
        checksumSha256: intent.checksumSha256,
      },
      authorize: () => true,
      storage: dependencies.storage,
    })
  }
}

export function createMediaUploadCompletionHandler(
  dependencies: BaseDependencies & {
    ingestion: {
      completeUploadIntent(input: {
        ownerUserId: string
        uploadIntentId: string
      }): Promise<{ id: string; processingState: string; processingErrorCode: string | null }>
    }
  },
) {
  return async function POST(request: Request, uploadIntentId: string) {
    const access = await authenticate(dependencies, request, true)
    if ('response' in access) return access.response
    try {
      const asset = await dependencies.ingestion.completeUploadIntent({
        ownerUserId: access.principal.id,
        uploadIntentId,
      })
      audit(
        dependencies,
        request,
        'media_upload.completed',
        access.principal.actorId,
      )
      return json(200, {
        mediaAsset: {
          id: asset.id,
          processingState: asset.processingState,
          processingErrorCode: asset.processingErrorCode,
        },
      })
    } catch (error) {
      return errorResponse(error)
    }
  }
}
