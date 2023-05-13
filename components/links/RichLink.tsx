'use client'

import { clsxm } from '@zolplay/utils'
import Image from 'next/image'
import Link, { type LinkProps } from 'next/link'
import React from 'react'

import { ExternalLinkIcon } from '~/assets'

type RichLinkProps = LinkProps &
  React.ComponentPropsWithoutRef<'a'> & {
    children: React.ReactNode
  }
export const RichLink = React.forwardRef<HTMLAnchorElement, RichLinkProps>(
  ({ children, href, className, ...props }, ref) => {
    const [iconUrl, setIconUrl] = React.useState<string | null>(null)
    React.useEffect(() => {
      fetch(`/api/favicon?url=${href}`)
        .then((res) => res.json())
        .then((data: { iconUrl?: string }) => {
          if (data.iconUrl) {
            setIconUrl(data.iconUrl)
          }
        })
        .catch((err) => {
          console.error(err)
        })
    }, [href])

    // if it's a relative link, use a fallback Link
    if (!href.startsWith('http')) {
      return (
        <Link href={href} className={className} ref={ref} {...props}>
          {children}
        </Link>
      )
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={clsxm('inline-flex items-center gap-0.5 pr-0.5', className)}
        rel="noopener noreferrer"
        target="_blank"
        {...props}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt={`${href} 的图标`}
            className="mr-0.5 inline-block h-3.5 w-3.5 rounded-xl"
            unoptimized
            width={14}
            height={14}
          />
        ) : (
          <span className="inline-block h-3.5 w-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-700" />
        )}
        {children}
        <ExternalLinkIcon className="inline-block" />
      </Link>
    )
  }
)
RichLink.displayName = 'RichLink'
