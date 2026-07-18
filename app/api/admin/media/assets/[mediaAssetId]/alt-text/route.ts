import { createMediaAltTextHandler } from '~/lib/media/admin/http'
import {
  getMediaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/media/admin/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mediaAssetId: string }> },
) {
  const { mediaAssetId } = await params
  const { altText, review, security } = getMediaAdminServices()
  return createMediaAltTextHandler({
    altText,
    review,
    authenticator: ownerRequestAuthenticator,
    security,
  })(request, mediaAssetId)
}
