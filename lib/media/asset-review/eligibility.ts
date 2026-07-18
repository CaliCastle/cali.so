import type { MediaAssetReviewRecord } from './service'

/**
 * Client-side mirror of the publish-eligibility invariant the server
 * enforces on Photo Selection save and publish: active, processed, with a
 * preview Rendition and approved bilingual Alt Text. The server remains
 * the authority (it additionally requires all three Rendition profiles);
 * this pre-filter only decides what the admin UI offers.
 */
export function isMediaAssetEligible(asset: MediaAssetReviewRecord) {
  return (
    asset.catalogState === 'active' &&
    asset.processingState === 'ready' &&
    asset.previewRendition !== null &&
    asset.altTextApprovedAt !== null &&
    Boolean(asset.altTextZhHans?.trim()) &&
    Boolean(asset.altTextEn?.trim())
  )
}

/** The reason an asset is not yet publishable, for picker copy. */
export function ineligibilityReason(
  asset: MediaAssetReviewRecord,
): 'processing' | 'alt_text' | 'archived' | null {
  if (isMediaAssetEligible(asset)) return null
  if (asset.catalogState !== 'active') return 'archived'
  if (asset.processingState !== 'ready' || asset.previewRendition === null) {
    return 'processing'
  }
  return 'alt_text'
}
