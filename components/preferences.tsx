'use client'

import { Popover } from '@base-ui/react/popover'
import { Monitor, Moon, Sun, Volume2, VolumeX } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { PreferencesIcon } from '~/components/dock-icons'
import { useTheme } from '~/components/theme-provider'
import { useEffect, useRef, useState } from 'react'

import { TabItem, Tabs, TabsList } from '~/components/ui/tabs'
import { Elevated } from '~/lib/elevated'
import { T } from '~/lib/i18n'
import { LOCALE_CHANGE_EVENT, localize, useLocale } from '~/lib/locale-client'
import { localePath, type Locale } from '~/lib/locale-route'
import {
  playDockSound,
  playPreferenceSound,
  setSoundEnabled,
  soundEnabled,
} from '~/lib/sound'

function Row({ zh, en, children }: { zh: string; en: string; children: React.ReactNode }) {
  return (
    <div className="prefs-row">
      <span className="prefs-row-label">
        <T zh={zh} en={en} />
      </span>
      {children}
    </div>
  )
}

// 偏好 — the dock's preferences panel: language, theme, and UI sound,
// each as full-width fluid tabs. On the public dock the site owner gets
// one more row (the way into the admin); the owner dock's variant swaps
// it for sign-out and never probes.
export function Preferences({
  variant = 'public',
  ownerAdmin = false,
  onOwnerAdminChange,
}: {
  variant?: 'public' | 'admin'
  ownerAdmin?: boolean
  onOwnerAdminChange?: (owner: boolean) => void
} = {}) {
  const activeLocale = useLocale()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [locale, setLocale] = useState<'zh' | 'en'>('zh')
  const [sound, setSound] = useState(false)
  const probingRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    setLocale(document.documentElement.dataset.locale === 'en' ? 'en' : 'zh')
    setSound(soundEnabled())
  }, [])

  // The owner probe runs on each panel open (never on page load, so public
  // pages stay static and ordinary visitors never trigger it in passing).
  // A confirmed answer is remembered so the row and the G D chord are
  // armed instantly on later visits, and a stale hint self-corrects the
  // next time the panel opens.
  function probeOwner(open: boolean) {
    if (!open || probingRef.current) return
    probingRef.current = true
    void fetch('/api/admin/session')
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { owner?: boolean } | null) => {
        const owner = data?.owner === true
        onOwnerAdminChange?.(owner)
        try {
          if (owner) localStorage.owner = '1'
          else delete localStorage.owner
        } catch {
          /* private mode */
        }
      })
      .catch(() => {
        /* offline — leave the current hint alone */
      })
      .finally(() => {
        probingRef.current = false
      })
  }

  function applyLocale(next: string) {
    const nextLocale = next as Locale
    const nextPathname =
      pathname && pathname !== '/admin' && !pathname.startsWith('/admin/')
        ? localePath(nextLocale, pathname)
        : null

    try {
      localStorage.locale = nextLocale
    } catch {
      /* private mode */
    }
    playPreferenceSound()

    if (nextPathname) {
      // Assigning pathname preserves the query and hash while keeping the
      // destination on this origin. localePath rejects malformed segments.
      window.location.pathname = nextPathname
      return
    }

    const html = document.documentElement
    if (nextLocale === 'en') {
      html.dataset.locale = 'en'
      html.lang = 'en'
    } else {
      delete html.dataset.locale
      html.lang = 'zh-CN'
    }
    setLocale(nextLocale)
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT))
  }

  return (
    <Popover.Root onOpenChange={variant === 'public' ? probeOwner : undefined}>
      <Popover.Trigger
        render={
          <button
            type="button"
            className="dock-item"
            aria-label={localize(activeLocale, '偏好设置', 'Preferences')}
            disabled={!mounted}
          >
            <PreferencesIcon />
            <span className="dock-tip" aria-hidden>
              <T zh="偏好" en="Preferences" />
            </span>
          </button>
        }
      />
      <Popover.Portal>
        <Popover.Positioner
          side="top"
          sideOffset={14}
          positionMethod="fixed"
          className="z-[var(--z-card)] outline-none"
        >
          <Popover.Popup
            aria-label={localize(activeLocale, '偏好设置', 'Preferences')}
            initialFocus
            finalFocus
            render={<Elevated offset={2} shadowLevel={3} />}
            className="prefs-panel w-max rounded-xl outline-none"
          >
            <Row zh="语言" en="Language">
              <Tabs value={mounted ? locale : activeLocale} onValueChange={applyLocale}>
                <TabsList aria-label={localize(activeLocale, '语言', 'Language')}>
                  <TabItem value="zh" label="中文" />
                  <TabItem value="en" label="English" />
                </TabsList>
              </Tabs>
            </Row>
            <Row zh="外观" en="Theme">
              <Tabs
                value={mounted && theme ? theme : 'system'}
                onValueChange={(v) => {
                  setTheme(v)
                  playPreferenceSound()
                }}
              >
                <TabsList aria-label={localize(activeLocale, '外观', 'Theme')}>
                  <TabItem value="light" icon={Sun} label="" aria-label={localize(activeLocale, '浅色', 'Light')} />
                  <TabItem value="system" icon={Monitor} label="" aria-label={localize(activeLocale, '系统', 'System')} />
                  <TabItem value="dark" icon={Moon} label="" aria-label={localize(activeLocale, '深色', 'Dark')} />
                </TabsList>
              </Tabs>
            </Row>
            <Row zh="音效" en="Sound">
              <Tabs
                value={mounted && sound ? 'on' : 'off'}
                onValueChange={(v) => {
                  const on = v === 'on'
                  if (!on) playPreferenceSound()
                  setSoundEnabled(on)
                  setSound(on)
                  if (on) playPreferenceSound()
                }}
              >
                <TabsList aria-label={localize(activeLocale, '音效', 'Sound')}>
                  <TabItem value="on" icon={Volume2} label="" aria-label={localize(activeLocale, '开', 'On')} />
                  <TabItem value="off" icon={VolumeX} label="" aria-label={localize(activeLocale, '关', 'Off')} />
                </TabsList>
              </Tabs>
            </Row>
            {variant === 'public' && ownerAdmin ? (
              <Link
                href="/admin"
                className="prefs-row prefs-admin"
                onClick={() => playDockSound()}
              >
                <span className="prefs-row-label">
                  <T zh="管理" en="Admin" />
                </span>
                <span className="dock-tip-keys" aria-hidden>
                  <kbd className="dock-tip-key">G</kbd>
                  <kbd className="dock-tip-key">D</kbd>
                </span>
              </Link>
            ) : null}
            {variant === 'admin' ? (
              <form method="post" action="/api/admin/auth/logout">
                <button type="submit" className="prefs-row prefs-admin prefs-signout">
                  <span className="prefs-row-label">
                    <T zh="退出登录" en="Sign out" />
                  </span>
                </button>
              </form>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
