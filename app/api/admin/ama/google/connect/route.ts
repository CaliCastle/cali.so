import { createGoogleConnectHandler } from '~/lib/ama/admin/http'
import {
  getAmaAdminServices,
  ownerRequestAuthenticator,
} from '~/lib/ama/admin/server'
import { protectAmaLaunchBoundary } from '~/lib/ama/security/launch-boundary-server'

export async function POST(request: Request) {
  const blocked = protectAmaLaunchBoundary(request, ['google'])
  if (blocked) return blocked
  const { google, security, baseUrl } = getAmaAdminServices()
  return createGoogleConnectHandler({
    authenticator: ownerRequestAuthenticator,
    service: google,
    security,
    baseUrl,
  })(request)
}
