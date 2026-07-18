import { Suspense } from 'react'

import { requireOwnerPage } from '~/lib/admin/server'

import { AdminShell } from './AdminShell'

async function OwnerGate() {
  await requireOwnerPage('/admin')
  return null
}

// The shell — column and owner dock — prerenders. Ownership is re-checked
// here in parallel for every admin route as defense in depth; each page's
// own loader independently requires the owner before touching any data.
export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      {children}
      <Suspense fallback={null}>
        <OwnerGate />
      </Suspense>
    </AdminShell>
  )
}
