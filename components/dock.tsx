'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import {
  AmaIcon,
  PhotosIcon,
  PreferencesIcon,
  ProjectsIcon,
  WritingIcon,
} from '~/components/dock-icons'
import { LiquidGlass } from '~/components/liquid-glass'
import { Preferences } from '~/components/preferences'
import { useDockActiveIndicator } from '~/hooks/use-dock-active-indicator'
import { dockGoKeyFor, useDockGoShortcuts } from '~/hooks/use-dock-go-shortcuts'
import { T } from '~/lib/i18n'
import { localize, useLocale } from '~/lib/locale-client'
import {
  localePath,
  type Locale,
  unlocalizedPathname,
} from '~/lib/locale-route'
import { playDockSound } from '~/lib/sound'

const ITEMS = [
  { href: '/blog', zh: '写作', en: 'Writing', icon: WritingIcon },
  { href: '/photos', zh: '照片', en: 'Photos', icon: PhotosIcon },
  { href: '/projects', zh: '项目', en: 'Projects', icon: ProjectsIcon },
  { href: '/ama', zh: '咨询', en: 'AMA', icon: AmaIcon },
] as const

export function DockTip({
  zh,
  en,
  goKey,
}: {
  zh: string
  en: string
  goKey?: string
}) {
  return (
    <span className="dock-tip" aria-hidden>
      <span className="dock-tip-label">
        <T zh={zh} en={en} />
      </span>
      {goKey ? (
        <span className="dock-tip-keys">
          <kbd className="dock-tip-key">G</kbd>
          <kbd className="dock-tip-key">{goKey}</kbd>
        </span>
      ) : null}
    </span>
  )
}

export function DockItem({
  href,
  locale,
  zh,
  en,
  goKey,
  active = false,
  itemRef,
  onNavigate,
  children,
}: {
  href: string
  locale: Locale
  zh: string
  en: string
  goKey?: string
  active?: boolean
  itemRef?: (element: HTMLAnchorElement | null) => void
  onNavigate?: (href: string, keyboardInitiated: boolean) => void
  children: React.ReactNode
}) {
  const label = localize(locale, zh, en)
  const ariaLabel = goKey
    ? localize(locale, `${zh}，G 然后 ${goKey}`, `${en}, G then ${goKey}`)
    : label

  return (
    <Link
      ref={itemRef}
      href={href}
      className="dock-item"
      data-active={active || undefined}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
      onClick={
        onNavigate
          ? (event) => {
              if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                onNavigate(href, event.detail === 0)
                if (!active) playDockSound()
              }
            }
          : undefined
      }
    >
      {children}
      <DockTip zh={zh} en={en} goKey={goKey} />
    </Link>
  )
}

export function DockFallback({ locale }: { locale: Locale }) {
  return (
    <nav
      className="dock"
      aria-label={localize(locale, '主导航', 'Main navigation')}
      aria-busy="true"
    >
      <LiquidGlass />
      <DockItem
        href={localePath(locale, '/')}
        locale={locale}
        zh="首页"
        en="Home"
        goKey={dockGoKeyFor('/')}
      >
        <span className="dock-avatar">
          <Image src="/images/avatar.png" alt="" width={26} height={26} />
        </span>
      </DockItem>
      <span className="dock-rule" aria-hidden />
      {ITEMS.map(({ href, zh, en, icon: Icon }) => (
        <DockItem
          key={href}
          href={localePath(locale, href)}
          locale={locale}
          zh={zh}
          en={en}
          goKey={dockGoKeyFor(href)}
        >
          <Icon />
        </DockItem>
      ))}
      <span className="dock-rule" aria-hidden />
      <button
        type="button"
        className="dock-item"
        aria-label={localize(locale, '偏好设置加载中', 'Loading preferences')}
        disabled
      >
        <PreferencesIcon />
        <DockTip zh="偏好" en="Preferences" />
      </button>
    </nav>
  )
}

// The global pill dock, bottom center — the avatar is home, everything
// else an icon. Circles inside a pill keep the radii concentric by
// construction.
export function Dock() {
  const locale = useLocale()
  const pathname = usePathname()
  const routePathname = unlocalizedPathname(pathname)
  const activeHref = routePathname === '/' ? '/' : ITEMS.find(({ href }) => routePathname.startsWith(href))?.href
  // Owner chrome is invisible until known: the hint remembers a confirmed
  // probe so the Admin row and its chord are armed instantly on later
  // visits; the probe itself runs when the Preferences panel opens.
  const [ownerAdmin, setOwnerAdmin] = useState(false)
  const { dockRef, indicatorRef, registerItem, handleNavigate } =
    useDockActiveIndicator(activeHref)

  useDockGoShortcuts({
    locale,
    activeHref,
    onNavigate: handleNavigate,
    ownerAdmin,
  })

  useEffect(() => {
    try {
      if (localStorage.owner === '1') setOwnerAdmin(true)
    } catch {
      /* private mode */
    }
  }, [])

  return (
    <nav ref={dockRef} className="dock" aria-label={localize(locale, '主导航', 'Main navigation')}>
      <LiquidGlass />
      <span ref={indicatorRef} className="dock-active-indicator" aria-hidden />
      <DockItem
        href={localePath(locale, '/')}
        locale={locale}
        zh="首页"
        en="Home"
        goKey={dockGoKeyFor('/')}
        active={routePathname === '/'}
        itemRef={(element) => registerItem('/', element)}
        onNavigate={handleNavigate}
      >
        <span className="dock-avatar">
          <Image src="/images/avatar.png" alt="" width={26} height={26} />
        </span>
      </DockItem>
      <span className="dock-rule" aria-hidden />
      {ITEMS.map(({ href, zh, en, icon: Icon }) => (
        <DockItem
          key={href}
          href={localePath(locale, href)}
          locale={locale}
          zh={zh}
          en={en}
          goKey={dockGoKeyFor(href)}
          active={routePathname.startsWith(href)}
          itemRef={(element) => registerItem(href, element)}
          onNavigate={handleNavigate}
        >
          <Icon />
        </DockItem>
      ))}
      <span className="dock-rule" aria-hidden />
      <Preferences ownerAdmin={ownerAdmin} onOwnerAdminChange={setOwnerAdmin} />
    </nav>
  )
}
