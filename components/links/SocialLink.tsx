'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Link, { type LinkProps } from 'next/link'
import React from 'react'

import {
  AtomIcon,
  BilibiliIcon,
  GitHubIcon,
  type IconProps,
  MailIcon,
  TelegramIcon,
  TwitterIcon,
  YouTubeIcon,
} from '~/assets'
import { Tooltip } from '~/components/ui/Tooltip'

type IconType = (props: IconProps) => JSX.Element
type Platform =
  | 'github'
  | 'twitter'
  | 'youtube'
  | 'telegram'
  | 'bilibili'
  | 'mail'
  | 'rss'
type PlatformInfo = {
  icon: IconType
  platform: Platform
  label: string
}
const iconMapper: { [key: string]: PlatformInfo } = {
  '(?:github.com)': { icon: GitHubIcon, platform: 'github', label: 'GitHub' },
  '((?:t.co)|(?:twitter.com))': {
    icon: TwitterIcon,
    platform: 'twitter',
    label: 'Twitter',
  },
  '((?:youtu.be)|(?:youtube.com))': {
    icon: YouTubeIcon,
    platform: 'youtube',
    label: 'YouTube',
  },
  '((?:t.me)|(?:telegram.com))': {
    icon: TelegramIcon,
    platform: 'telegram',
    label: 'Telegram',
  },
  '(?:bilibili.com)': {
    icon: BilibiliIcon,
    platform: 'bilibili',
    label: '哔哩哔哩',
  },
  '(?:mailto:)': { icon: MailIcon, platform: 'mail', label: '邮箱地址' },
  '(?:feed.xml)': { icon: AtomIcon, platform: 'rss', label: 'RSS 订阅' },
}

function getIconForUrl(url: string): PlatformInfo | undefined {
  for (const regexStr in iconMapper) {
    const regex = new RegExp(
      `^(?:https?:\/\/)?(?:[^@/\\n]+@)?(?:www.)?` + regexStr
    )
    if (regex.test(url)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return iconMapper[regexStr]!
    }
  }

  return undefined
}

function getIconForPlatform(
  platform: Platform | undefined
): PlatformInfo | undefined {
  if (!platform) {
    return undefined
  }

  for (const info of Object.values(iconMapper)) {
    if (info.platform === platform) {
      return info
    }
  }

  return undefined
}

export function SocialLink({
  platform,
  href,
  ...props
}: { platform?: Platform } & LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const [open, setOpen] = React.useState(false)
  const info = getIconForPlatform(platform) ?? getIconForUrl(href.toString())

  if (!info) {
    console.warn(`No icon found for ${href.toString()}`)

    return <Link href={href} {...props} />
  }

  return (
    <Tooltip.Provider disableHoverableContent>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <Link
            className="group -m-1 p-1"
            href={href}
            target="_blank"
            prefetch={false}
            aria-label={info.label}
            {...props}
          >
            <info.icon className="h-5 w-5 text-zinc-400 transition group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
          </Link>
        </Tooltip.Trigger>
        <AnimatePresence>
          {open && (
            <Tooltip.Portal forceMount>
              <Tooltip.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {info.label}
                </motion.div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </AnimatePresence>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
