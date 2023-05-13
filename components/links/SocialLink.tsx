import Link, { type LinkProps } from 'next/link'
import React from 'react'

import {
  BilibiliIcon,
  GitHubIcon,
  type IconProps,
  MailIcon,
  TelegramIcon,
  TwitterIcon,
  YouTubeIcon,
} from '~/assets'

type IconType = (props: IconProps) => JSX.Element
type Platform =
  | 'github'
  | 'twitter'
  | 'youtube'
  | 'telegram'
  | 'bilibili'
  | 'mail'
type PlatformIcon = {
  icon: IconType
  platform: Platform
}
const iconMapper: { [key: string]: PlatformIcon } = {
  '(?:github.com)': { icon: GitHubIcon, platform: 'github' },
  '((?:t.co)|(?:twitter.com))': { icon: TwitterIcon, platform: 'twitter' },
  '((?:youtu.be)|(?:youtube.com))': { icon: YouTubeIcon, platform: 'youtube' },
  '((?:t.me)|(?:telegram.com))': { icon: TelegramIcon, platform: 'telegram' },
  '(?:bilibili.com)': { icon: BilibiliIcon, platform: 'bilibili' },
  '(?:mailto:)': { icon: MailIcon, platform: 'mail' },
}

function getIconForUrl(url: string): IconType | undefined {
  for (const regexStr in iconMapper) {
    const regex = new RegExp(
      `^(?:https?:\/\/)?(?:[^@/\\n]+@)?(?:www.)?` + regexStr
    )
    if (regex.test(url)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { icon } = iconMapper[regexStr]!
      return icon
    }
  }

  return undefined
}

function getIconForPlatform(
  platform: Platform | undefined
): IconType | undefined {
  if (!platform) {
    return undefined
  }

  for (const { icon, platform: p } of Object.values(iconMapper)) {
    if (p === platform) {
      return icon
    }
  }

  return undefined
}

export function SocialLink({
  icon,
  platform,
  href,
  ...props
}: { icon?: IconType; platform?: Platform } & LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const Icon =
    icon ?? getIconForPlatform(platform) ?? getIconForUrl(href.toString())

  if (!Icon) {
    console.warn(`No icon found for ${href.toString()}`)
  }

  return (
    <Link
      className="group -m-1 p-1"
      href={href}
      target="_blank"
      prefetch={false}
      {...props}
    >
      {Icon && (
        <Icon className="h-5 w-5 text-zinc-400 transition group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
      )}
    </Link>
  )
}
