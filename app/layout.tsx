import '~/app/globals.css'

import { ClerkProvider } from '@clerk/nextjs/app-beta'

import { ThemeProvider } from '~/app/ThemeProvider'
import { Header } from '~/components/layouts/Header'
import { sansFont } from '~/lib/font'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="zh"
      className={`${sansFont.variable} m-0 h-full p-0 font-sans antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col bg-zinc-50 bg-[url('/grid-black.svg')] bg-top bg-repeat dark:bg-primary-900 dark:bg-[url('/grid.svg')]">
        <span className="pointer-events-none fixed top-0 block h-[800px] w-full select-none bg-[radial-gradient(103.72%_46.58%_at_50%_0%,rgba(5,5,5,0.045)_0%,rgba(0,0,0,0)_100%)] dark:bg-[radial-gradient(103.72%_46.58%_at_50%_0%,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0)_100%)]" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <div className="fixed inset-0 flex justify-center sm:px-8">
              <div className="flex w-full max-w-7xl lg:px-8">
                <div className="w-full bg-zinc-50/90 ring-1 ring-zinc-100 dark:bg-zinc-900/80 dark:ring-zinc-400/20" />
              </div>
            </div>

            <div className="relative text-slate-50">
              <Header />

              <main>{children}</main>
            </div>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
