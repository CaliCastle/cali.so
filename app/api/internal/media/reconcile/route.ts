import { createMediaReconciliationHandler } from '~/lib/media/reconciliation/http'
import { getMediaAdminServices } from '~/lib/media/admin/server'
import { publicContentOnlyNotFound } from '~/lib/public-content-only'

export const maxDuration = 60

export async function GET(request: Request) {
  const unavailable = publicContentOnlyNotFound()
  if (unavailable) return unavailable
  return createMediaReconciliationHandler({
    cronSecret: process.env.CRON_SECRET,
    getReconciliation: () => getMediaAdminServices().reconciliation,
  })(request)
}
