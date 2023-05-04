import Link, { type LinkProps } from 'next/link'
import React from 'react'
import { type IconType } from 'react-icons'
import {
  BsGithub,
  BsLinkedin,
  BsTelegram,
  BsTwitter,
  BsYoutube,
} from 'react-icons/bs'
import { IoMailOpen } from 'react-icons/io5'

type Platform =
  | 'github'
  | 'twitter'
  | 'youtube'
  | 'telegram'
  | 'linkedin'
  | 'mail'
type PlatformIcon = {
  icon: IconType
  platform: Platform
}
const iconMapper: { [key: string]: PlatformIcon } = {
  '(?:github.com)': { icon: BsGithub, platform: 'github' },
  '((?:t.co)|(?:twitter.com))': { icon: BsTwitter, platform: 'twitter' },
  '((?:youtu.be)|(?:youtube.com))': { icon: BsYoutube, platform: 'youtube' },
  '((?:t.me)|(?:telegram.com))': { icon: BsTelegram, platform: 'telegram' },
  '(?:linkedin.com)': { icon: BsLinkedin, platform: 'linkedin' },
  '(?:mailto:)': { icon: IoMailOpen, platform: 'mail' },
}

function getIconForUrl(url: string): IconType | undefined {
  for (const regexStr in iconMapper) {
    const regex = new RegExp(
      `^(?:https?:\/\/)?(?:[^@/\\n]+@)?(?:www.)?` + regexStr
    )
    if (regex.test(url)) {
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

  for (const regexStr in iconMapper) {
    const { icon, platform: p } = iconMapper[regexStr]!
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
        <Icon className="h-5 w-5 fill-zinc-400 transition group-hover:fill-zinc-700 dark:fill-zinc-500 dark:group-hover:fill-zinc-200" />
      )}
    </Link>
  )
}
