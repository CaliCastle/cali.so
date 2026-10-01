import { createMediaAssetListHandler } from '~/lib/media/admin/http'
import {
  getMediaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/media/admin/server'
import { publicContentOnlyNotFound } from '~/lib/public-content-only'

export async function GET(request: Request) {
  const unavailable = publicContentOnlyNotFound()
  if (unavailable) return unavailable
  const { review, security } = getMediaAdminServices()
  return createMediaAssetListHandler({
    authenticator: ownerRequestAuthenticator,
    review,
    security,
  })(request)
}
