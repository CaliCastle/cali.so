import '../globals.css'
import type { Metadata } from 'next'

import { rootMetadata, SiteDocument } from '../_components/site-document'
import {
  nonPublicDescriptions,
  nonPublicRobots,
} from '~/lib/non-public-metadata'

export const metadata: Metadata = {
  ...rootMetadata,
  description: nonPublicDescriptions.admin,
  robots: nonPublicRobots,
}

// The admin document is a static shell (July 2026): the paper, column, and
// owner dock prerender and prefetch, while everything the owner actually
// sees streams from per-request loaders behind each page's Suspense
// boundary. Ownership is enforced by clerkMiddleware plus requireOwnerPage
// inside those loaders — no client-side Clerk remains, so there is no
// provider here.
export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <SiteDocument isAdmin locale="zh" restoreLocale>
      {children}
    </SiteDocument>
  )
}
