import type { Metadata } from 'next'

import { requireOwnerPage } from '~/lib/admin/server'
import { getAmaAdminServices } from '~/lib/ama/admin/server'
import type {
  AlternateTimeRequestRecord,
  BookingRecord,
} from '~/lib/ama/booking/repository'
import type { DurableOperationRecord } from '~/lib/ama/operations/repository'
import { nonPublicRobots } from '~/lib/non-public-metadata'

import { AmaOperations } from './AmaOperations'
import type { AmaSettingsNotices, GoogleConnectionStatus } from './AmaSettings'
import type {
  AlternateTimeRequestViewModel,
  BookingRowViewModel,
  OperationViewModel,
} from './shared'

export const metadata: Metadata = {
  title: 'AMA',
  robots: nonPublicRobots,
}

// Booking operations data intentionally renders per request.
export const instant = false

function bookingRow(booking: BookingRecord): BookingRowViewModel {
  return {
    id: booking.id,
    status: booking.status,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestTimeZone: booking.guestTimeZone,
    meetingProvider: booking.meetingProvider,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    refundStatus: booking.refundStatus,
    hasMeetingLink: booking.meetingUrl !== null,
    hasBrief:
      booking.briefPurgedAt === null &&
      (booking.briefText !== null || (booking.briefUrls?.length ?? 0) > 0),
  }
}

function operationRow(operation: DurableOperationRecord): OperationViewModel {
  return {
    id: operation.id,
    kind: operation.kind,
    bookingId: operation.bookingId,
    status: operation.status,
    attemptCount: operation.attemptCount,
    maxAttempts: operation.maxAttempts,
    nextAttemptAt: operation.nextAttemptAt.toISOString(),
    lastErrorCode: operation.lastErrorCode,
  }
}

function timeRequestRow(
  request: AlternateTimeRequestRecord,
): AlternateTimeRequestViewModel {
  return {
    id: request.id,
    guestName: request.guestName,
    guestEmail: request.guestEmail,
    guestTimeZone: request.guestTimeZone,
    preferredWindows: request.preferredWindows,
    note: request.note,
    createdAt: request.createdAt.toISOString(),
  }
}

const availabilityNotices = new Set(['saved', 'invalid', 'failed'] as const)
const calendarNotices = new Set([
  'disconnected',
  'connected',
  'expired',
  'revoked',
  'denied-scope',
  'unavailable',
] as const)

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function queryNotices(input: {
  availability?: string | string[]
  calendar?: string | string[]
}): AmaSettingsNotices {
  const availability = first(input.availability)
  const calendar = first(input.calendar)
  return {
    availability: availabilityNotices.has(
      availability as AmaSettingsNotices['availability'] & string,
    )
      ? (availability as AmaSettingsNotices['availability'])
      : undefined,
    calendar: calendarNotices.has(calendar as GoogleConnectionStatus)
      ? (calendar as GoogleConnectionStatus)
      : undefined,
  }
}

function connectionStatus(status: string | undefined): GoogleConnectionStatus {
  if (status === 'connected' || status === 'expired' || status === 'revoked') {
    return status
  }
  if (status === 'denied_scope') return 'denied-scope'
  if (status === 'error') return 'unavailable'
  return 'disconnected'
}

export default async function AdminAmaPage({
  searchParams,
}: {
  searchParams: Promise<{
    availability?: string | string[]
    calendar?: string | string[]
  }>
}) {
  await requireOwnerPage('/admin/ama')
  const { availability, bookingAdmin, google } = getAmaAdminServices()
  const [
    upcoming,
    past,
    attention,
    timeRequests,
    operations,
    windows,
    connection,
    preview,
    params,
  ] = await Promise.all([
    bookingAdmin.listBookings('upcoming'),
    bookingAdmin.listBookings('past'),
    bookingAdmin.listBookings('attention'),
    bookingAdmin.listAlternateTimeRequests('new'),
    bookingAdmin.listUnresolvedOperations(),
    availability.list(),
    google.getConnection(),
    availability.preview(),
    searchParams,
  ])

  const persistedStatus = connectionStatus(connection?.status)
  const status =
    persistedStatus === 'connected' && preview.status !== 'connected'
      ? preview.status
      : persistedStatus

  return (
    <AmaOperations
      upcoming={upcoming.map(bookingRow)}
      past={past.map(bookingRow)}
      attention={attention.map(bookingRow)}
      timeRequests={timeRequests.map(timeRequestRow)}
      failedOperations={operations
        .filter((operation) => operation.status === 'failed')
        .map(operationRow)}
      settings={{
        windows: windows.map(({ id, isoWeekday, startMinute, endMinute }) => ({
          id,
          isoWeekday,
          startMinute,
          endMinute,
        })),
        googleConnection: {
          status,
          identity:
            connection?.calendarId && connection.status !== 'disconnected'
              ? {
                  calendarId: connection.calendarId,
                  summary: connection.calendarSummary,
                  email: connection.calendarEmail,
                }
              : null,
        },
        previewSlots: preview.slots.map((slot) => ({
          startsAt: slot.startsAt.toISOString(),
          endsAt: slot.endsAt.toISOString(),
        })),
        notices: queryNotices(params),
      }}
    />
  )
}
