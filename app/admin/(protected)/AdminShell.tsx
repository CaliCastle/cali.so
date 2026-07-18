import { AdminDock } from '~/components/admin-dock'

// The admin shares the public layout grammar: content in the centered
// 37.5rem column over the ambient paper, with the owner dock fixed at the
// bottom as the only navigation chrome. Pages own their headings; sign-out
// lives in the dock's Preferences panel.
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full max-w-[37.5rem] px-6">{children}</div>
      <AdminDock />
    </>
  )
}
