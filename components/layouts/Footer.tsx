import kv from '@vercel/kv'
import Link from 'next/link'
import React, { Suspense } from 'react'
import { TbUsers } from 'react-icons/tb'

import { Container } from '~/components/ui/Container'
import { navigationItems } from '~/config/nav'
import { env } from '~/env.mjs'

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="transition hover:text-lime-500 dark:hover:text-lime-400"
    >
      {children}
    </Link>
  )
}

function Links() {
  return (
    <nav className="flex gap-6 text-sm font-medium text-zinc-800 dark:text-zinc-200">
      {navigationItems.map(({ href, text }) => (
        <NavLink key={href} href={href}>
          {text}
        </NavLink>
      ))}
    </nav>
  )
}

async function TotalPageViews() {
  let views: number
  if (env.VERCEL_ENV === 'production') {
    views = await kv.incr('total_page_views')
  } else {
    views = (await kv.get<number>('total_page_views')) ?? 0
  }

  return (
    <span className="flex items-center justify-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 md:justify-start">
      <span>
        总浏览量 <span className="font-medium">{views}</span>
      </span>
      <TbUsers />
    </span>
  )
}

export function Footer() {
  return (
    <footer className="mt-32">
      <Container.Outer>
        <div className="border-t border-zinc-100 pb-16 pt-10 dark:border-zinc-700/40">
          <Container.Inner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                &copy; 1995 - {new Date().getFullYear()} Cali Castle.
              </p>
              <Links />
            </div>
          </Container.Inner>
          <Container.Inner className="mt-6">
            <Suspense fallback={<span>...</span>}>
              {/* @ts-expect-error Async Server Component */}
              <TotalPageViews />
            </Suspense>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}
