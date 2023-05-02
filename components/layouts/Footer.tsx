import kv from '@vercel/kv'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { CursorClickIcon } from '~/components/icons/CursorClickIcon'
import { UsersIcon } from '~/components/icons/UsersIcon'
import { Container } from '~/components/ui/Container'
import { kvKeys } from '~/config/kv'
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

function formatNumber(n: number, inChinese = false): string {
  if (inChinese) {
    if (Math.abs(n) >= 100000000) {
      return (n / 100000000).toFixed(1) + '亿'
    } else if (Math.abs(n) >= 10000) {
      return (n / 10000).toFixed(1) + '万'
    } else {
      return Intl.NumberFormat('en-US').format(n)
    }
  }

  if (Math.abs(n) >= 1000000) {
    return (n / 1000000).toFixed(1) + 'm'
  } else if (Math.abs(n) >= 1000) {
    return (n / 1000).toFixed(1) + 'k'
  } else {
    return Intl.NumberFormat('en-US').format(n)
  }
}

async function TotalPageViews() {
  let views: number
  if (env.VERCEL_ENV === 'production') {
    views = await kv.incr(kvKeys.totalPageViews)
  } else {
    views = 345678
  }

  return (
    <span className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 md:justify-start">
      <UsersIcon className="h-4 w-4" />
      <span title={`${Intl.NumberFormat('en-US').format(views)}次浏览`}>
        总浏览量&nbsp;
        <span className="font-medium">{formatNumber(views, true)}</span>
      </span>
    </span>
  )
}

type VisitorGeolocation = {
  country: string
  city?: string
  flag: string
}
async function LastVisitorInfo() {
  let lastVisitor: VisitorGeolocation | undefined = undefined
  if (env.VERCEL_ENV === 'production') {
    const [lv, cv] = await kv.mget<VisitorGeolocation[]>(
      kvKeys.lastVisitor,
      kvKeys.currentVisitor
    )
    lastVisitor = lv
    await kv.set(kvKeys.lastVisitor, cv)
  }

  if (!lastVisitor) {
    lastVisitor = {
      country: 'US',
      flag: '🇺🇸',
    }
  }

  return (
    <span className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 md:justify-start">
      <CursorClickIcon className="h-4 w-4" />
      <span>
        最近访客来自&nbsp;
        {[lastVisitor.city, lastVisitor.country].filter(Boolean).join(', ')}
      </span>
      <span className="font-medium">{lastVisitor.flag}</span>
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
              <p className="text-sm text-zinc-500/80 dark:text-zinc-400/80">
                &copy; 1995 - {new Date().getFullYear()} Cali Castle.
              </p>
              <Links />
            </div>
          </Container.Inner>
          <Container.Inner className="mt-6">
            <div className="flex flex-col items-center justify-start gap-2 sm:flex-row">
              <Suspense>
                {/* @ts-expect-error Async Server Component */}
                <TotalPageViews />
              </Suspense>
              <Suspense>
                {/* @ts-expect-error Async Server Component */}
                <LastVisitorInfo />
              </Suspense>
            </div>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}
