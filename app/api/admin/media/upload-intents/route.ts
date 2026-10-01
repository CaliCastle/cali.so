import {
  createMediaTransferListHandler,
  createMediaUploadIntentHandler,
} from '~/lib/media/admin/http'
import {
  getMediaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/media/admin/server'
import { publicContentOnlyNotFound } from '~/lib/public-content-only'

export async function POST(request: Request) {
  const { ingestion, security } = getMediaAdminServices()
  return createMediaUploadIntentHandler({
    authenticator: ownerRequestAuthenticator,
    ingestion,
    security,
  })(request)
}

export async function GET(request: Request) {
  const unavailable = publicContentOnlyNotFound()
  if (unavailable) return unavailable
  const { security, transfer } = getMediaAdminServices()
  return createMediaTransferListHandler({
    authenticator: ownerRequestAuthenticator,
    security,
    transfer,
  })(request)
}
