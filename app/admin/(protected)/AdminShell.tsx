import { Suspense } from 'react'

import { AdminDock, AdminDockFallback } from '~/components/admin-dock'

// The admin shares the public layout grammar: content in the centered
// 37.5rem column over the ambient paper, with the owner dock fixed at the
// bottom as the only navigation chrome. Pages own their headings; sign-out
// lives in the dock's Preferences panel. The dock reads the route for its
// active marker, so it streams over an identical static bar.
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full max-w-[37.5rem] px-6">{children}</div>
      <Suspense fallback={<AdminDockFallback />}>
        <AdminDock />
      </Suspense>
    </>
  )
}
