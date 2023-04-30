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

const iconMapper: { [key: string]: IconType } = {
  '(?:github.com)': BsGithub,
  '((?:t.co)|(?:twitter.com))': BsTwitter,
  '((?:youtu.be)|(?:youtube.com))': BsYoutube,
  '((?:t.me)|(?:telegram.com))': BsTelegram,
  '(?:linkedin.com)': BsLinkedin,
  '(?:mailto:)': IoMailOpen,
}

function getIconForUrl(url: string): IconType | undefined {
  for (const regexStr in iconMapper) {
    const regex = new RegExp(
      `^(?:https?:\/\/)?(?:[^@/\\n]+@)?(?:www.)?` + regexStr
    )
    if (regex.test(url)) {
      return iconMapper[regexStr]
    }
  }

  return undefined
}

export function SocialLink({
  icon,
  href,
  ...props
}: { icon?: IconType } & LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const Icon = icon || getIconForUrl(href.toString())

  if (!Icon) {
    console.warn(`No icon found for ${href.toString()}`)
  }

  return (
    <Link className="group -m-1 p-1" href={href} target="_blank" {...props}>
      {Icon && (
        <Icon className="h-5 w-5 fill-zinc-400 transition group-hover:fill-zinc-700 dark:fill-zinc-500 dark:group-hover:fill-zinc-200" />
      )}
    </Link>
  )
}
