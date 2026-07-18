'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'

import {
  AmaIcon,
  MediaIcon,
  PhotosIcon,
  PreferencesIcon,
  SiteReturnIcon,
} from '~/components/dock-icons'
import { DockItem } from '~/components/dock'
import { LiquidGlass } from '~/components/liquid-glass'
import { Preferences } from '~/components/preferences'
import { useDockActiveIndicator } from '~/hooks/use-dock-active-indicator'
import { adminGoKeyFor, useAdminGoShortcuts } from '~/hooks/use-dock-go-shortcuts'
import { localePath } from '~/lib/locale-route'
import { localize, useLocale } from '~/lib/locale-client'

const ITEMS = [
  { href: '/admin/ama', zh: '咨询', en: 'AMA', icon: AmaIcon },
  { href: '/admin/media', zh: '媒体', en: 'Media', icon: MediaIcon },
  { href: '/admin/photos', zh: '照片', en: 'Photos', icon: PhotosIcon },
] as const

// The Suspense fallback that keeps the owner dock in the prerendered
// shell: the identical bar without the route-aware marker or the
// Preferences panel (which needs client state). Mirrors DockFallback.
export function AdminDockFallback() {
  return (
    <nav
      className="dock"
      aria-label={localize('zh', '管理导航', 'Admin navigation')}
      aria-busy="true"
    >
      <LiquidGlass />
      <DockItem
        href="/admin"
        locale="zh"
        zh="总览"
        en="Overview"
        goKey={adminGoKeyFor('/admin')}
      >
        <span className="dock-avatar">
          <Image src="/images/avatar.png" alt="" width={26} height={26} />
        </span>
      </DockItem>
      <span className="dock-rule" aria-hidden />
      {ITEMS.map(({ href, zh, en, icon: Icon }) => (
        <DockItem
          key={href}
          href={href}
          locale="zh"
          zh={zh}
          en={en}
          goKey={adminGoKeyFor(href)}
        >
          <Icon />
        </DockItem>
      ))}
      <span className="dock-rule" aria-hidden />
      <DockItem
        href="/"
        locale="zh"
        zh="返回站点"
        en="Back to site"
        goKey={adminGoKeyFor('/')}
      >
        <SiteReturnIcon />
      </DockItem>
      <button
        type="button"
        className="dock-item"
        aria-label={localize('zh', '偏好设置加载中', 'Loading preferences')}
        disabled
      >
        <PreferencesIcon />
      </button>
    </nav>
  )
}

// The owner dock: the public dock's grammar — glass pill, sliding marker,
// go-chords, tooltips — carrying the admin surfaces. The avatar is the
// Overview, the return arrow leaves for the public site, and Preferences
// gains the in-admin locale/theme/sound rows plus sign-out.
export function AdminDock() {
  const locale = useLocale()
  const pathname = usePathname()
  const activeHref =
    pathname === '/admin'
      ? '/admin'
      : ITEMS.find(({ href }) => pathname.startsWith(href))?.href
  const { dockRef, indicatorRef, registerItem, handleNavigate } =
    useDockActiveIndicator(activeHref)

  useAdminGoShortcuts({
    locale,
    activeHref,
    onNavigate: handleNavigate,
  })

  return (
    <nav
      ref={dockRef}
      className="dock"
      aria-label={localize(locale, '管理导航', 'Admin navigation')}
    >
      <LiquidGlass />
      <span ref={indicatorRef} className="dock-active-indicator" aria-hidden />
      <DockItem
        href="/admin"
        locale={locale}
        zh="总览"
        en="Overview"
        goKey={adminGoKeyFor('/admin')}
        active={pathname === '/admin'}
        itemRef={(element) => registerItem('/admin', element)}
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
          href={href}
          locale={locale}
          zh={zh}
          en={en}
          goKey={adminGoKeyFor(href)}
          active={pathname.startsWith(href)}
          itemRef={(element) => registerItem(href, element)}
          onNavigate={handleNavigate}
        >
          <Icon />
        </DockItem>
      ))}
      <span className="dock-rule" aria-hidden />
      <DockItem
        href={localePath(locale, '/')}
        locale={locale}
        zh="返回站点"
        en="Back to site"
        goKey={adminGoKeyFor('/')}
        onNavigate={handleNavigate}
      >
        <SiteReturnIcon />
      </DockItem>
      <Preferences variant="admin" />
    </nav>
  )
}
