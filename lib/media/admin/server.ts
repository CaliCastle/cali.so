import 'server-only'

import { revalidateTag } from 'next/cache'

import { getDatabase } from '~/db'
import {
  getOwnerAdminSecurity,
  ownerRequestAuthenticator,
} from '~/lib/admin/server'
import { getServerEnv } from '~/lib/ama/server-env'
import { createRateLimiter } from '~/lib/rate-limit/server'

import { parseMediaAltTextEnv } from '../alt-text/config'
import { createMediaAltTextGenerator } from '../alt-text/gateway'
import { createMediaAltTextRepository } from '../alt-text/repository'
import { createMediaAltTextService } from '../alt-text/service'
import { createMediaAssetReviewRepository } from '../asset-review/repository'
import { createMediaAssetReviewService } from '../asset-review/service'
import { parseMediaGeocodingEnv } from '../geocoding/config'
import { createGoogleMapsLocationLabelSuggester } from '../geocoding/provider'
import { createMediaGeocodingRepository } from '../geocoding/repository'
import { createMediaGeocodingService } from '../geocoding/service'
import { createMediaIngestionRepository } from '../ingestion/repository'
import { createMediaIngestionService } from '../ingestion/service'
import { createCaptureLocationVault } from '../privacy/capture-location'
import {
  createPhotoSelectionRepository,
  PUBLIC_PHOTO_SELECTION_CACHE_TAG,
} from '../photo-selection/repository'
import { createPhotoSelectionService } from '../photo-selection/service'
import { createMediaPurgeRepository } from '../purge/repository'
import { createMediaPurgeService } from '../purge/service'
import { createMediaReconciliationRepository } from '../reconciliation/repository'
import { createMediaReconciliationService } from '../reconciliation/service'
import { createPublicRenditionUrl } from '../storage/bunny'
import { parseBunnyRenditionCdnEnv } from '../storage/config'
import { getMediaStorage } from '../storage/server'

let services: ReturnType<typeof createServices> | undefined
let pageServices: ReturnType<typeof createPageServices> | undefined

function createCatalogServices(publicRenditionUrl: (key: string) => string) {
  const database = () => getDatabase()
  const review = createMediaAssetReviewService({
    repository: createMediaAssetReviewRepository(database, publicRenditionUrl),
  })
  const selection = createPhotoSelectionService({
    repository: createPhotoSelectionRepository(database),
    invalidatePublicSelection: async () => {
      // Next 16.3 requires a cache-life profile or expire object here;
      // updateTag is restricted to Server Actions and this runs in a Route Handler.
      revalidateTag(PUBLIC_PHOTO_SELECTION_CACHE_TAG, { expire: 0 })
    },
  })

  return { database, review, selection }
}

function createPageServices() {
  const cdnBaseUrl = parseBunnyRenditionCdnEnv(process.env)
  const { review, selection } = createCatalogServices(
    createPublicRenditionUrl(cdnBaseUrl),
  )
  return {
    getDraft: selection.getDraft,
    listAssets: review.listAssets,
  }
}

function createServices() {
  const environment = getServerEnv()
  const storage = getMediaStorage()
  const { database, review, selection } = createCatalogServices(
    storage.publicRenditionUrl,
  )
  const ingestionRepository = createMediaIngestionRepository(database)
  const mediaEncryptionKey = process.env.MEDIA_ENCRYPTION_KEY
  if (!mediaEncryptionKey) {
    throw new Error('Invalid Media environment: MEDIA_ENCRYPTION_KEY')
  }
  const captureLocationVault = createCaptureLocationVault(mediaEncryptionKey)
  const ingestion = createMediaIngestionService({
    repository: ingestionRepository,
    storage,
    captureLocationVault,
  })
  const purge = createMediaPurgeService({
    repository: createMediaPurgeRepository(database),
    storage,
  })
  const altTextConfig = parseMediaAltTextEnv(process.env)
  const altText = createMediaAltTextService({
    repository: createMediaAltTextRepository(database),
    storage,
    generator: createMediaAltTextGenerator(altTextConfig),
    rateLimiter: createRateLimiter(environment.rateLimitBackend, {
      prefix: 'cali:media:alt-text',
      maxRequests: altTextConfig.rateLimitMaxRequests,
      windowSeconds: altTextConfig.rateLimitWindowSeconds,
    }),
  })

  const geocodingConfig = parseMediaGeocodingEnv(process.env)
  const geocoding = geocodingConfig.apiKey
    ? createMediaGeocodingService({
        repository: createMediaGeocodingRepository(database),
        captureLocationVault,
        suggester: createGoogleMapsLocationLabelSuggester({
          apiKey: geocodingConfig.apiKey,
        }),
      })
    : null
  const reconciliation = createMediaReconciliationService({
    repository: createMediaReconciliationRepository(database),
    ingestion,
    storage,
    altText,
  })

  return {
    altText,
    baseUrl: environment.SITE_URL,
    geocoding,
    ingestion,
    ingestionRepository,
    purge,
    reconciliation,
    review,
    selection,
    security: getOwnerAdminSecurity(),
    storage,
  }
}

export function getMediaAdminServices() {
  services ??= createServices()
  return services
}

export function getMediaAdminPageServices() {
  pageServices ??= createPageServices()
  return pageServices
}

export { ownerRequestAuthenticator }
