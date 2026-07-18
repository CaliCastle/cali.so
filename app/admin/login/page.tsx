import { redirect } from 'next/navigation'

import { requireOwnerPage } from '~/lib/admin/server'

// A pure redirect — signed-out owners bounce to Clerk sign-in, signed-in
// owners to /admin. There is no shell worth prerendering here.
export const instant = false

export default async function AdminLoginRedirectPage() {
  await requireOwnerPage('/admin')
  redirect('/admin')
}
