import { createMediaPurgeHandler } from '~/lib/media/admin/http'
import {
  getMediaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/media/admin/server'

function handler() {
  const { purge, security } = getMediaAdminServices()
  return createMediaPurgeHandler({
    authenticator: ownerRequestAuthenticator,
    purge,
    security,
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ mediaAssetId: string }> },
) {
  return handler().GET(request, (await params).mediaAssetId)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mediaAssetId: string }> },
) {
  return handler().POST(request, (await params).mediaAssetId)
}
