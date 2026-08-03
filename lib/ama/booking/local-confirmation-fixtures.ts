const LOCAL_CONFIRMATION_FIXTURES = {
  '00000000-0000-4000-8000-000000000001': 'confirmed',
  '00000000-0000-4000-8000-000000000002': 'finalizing',
  '00000000-0000-4000-8000-000000000003': 'needs_reschedule',
} as const

export function getLocalConfirmationFixture(
  holdId: string,
  environment = process.env.NODE_ENV,
) {
  if (environment !== 'development') return null
  return (
    LOCAL_CONFIRMATION_FIXTURES[
      holdId as keyof typeof LOCAL_CONFIRMATION_FIXTURES
    ] ?? null
  )
}
