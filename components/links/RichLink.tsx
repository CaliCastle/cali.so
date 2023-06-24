'use client'

import { clsxm } from '@zolplay/utils'
import Image from 'next/image'
import Link, { type LinkProps } from 'next/link'
import React from 'react'

import { ExternalLinkIcon } from '~/assets'

const hostsThatNeedInvertedFavicons = ['github.com']

type RichLinkProps = LinkProps &
  React.ComponentPropsWithoutRef<'a'> & {
    children: React.ReactNode
  } & {
    favicon?: boolean
  }
export const RichLink = React.forwardRef<HTMLAnchorElement, RichLinkProps>(
  ({ children, href, favicon = true, className, ...props }, ref) => {
    const hrefHost = new URL(href).host
    const faviconUrl = React.useMemo(
      () => (href.startsWith('http') ? `/api/favicon?url=${hrefHost}` : null),
      [href, hrefHost]
    )

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
        className={clsxm(
          'inline-flex place-items-baseline items-baseline gap-0.5 pr-0.5 text-[0.95em] leading-none',
          className
        )}
        rel="noopener noreferrer"
        target="_blank"
        {...props}
      >
        {favicon && faviconUrl && (
          <span
            className={clsxm(
              'mr-px inline-flex translate-y-0.5',
              hostsThatNeedInvertedFavicons.includes(hrefHost) && 'dark:invert'
            )}
          >
            <Image
              src={faviconUrl}
              alt=""
              aria-hidden="true"
              className="inline h-4 w-4 rounded"
              width={16}
              height={16}
              unoptimized
              priority={false}
            />
          </span>
        )}

        {children}
        {faviconUrl && (
          <ExternalLinkIcon
            width="0.95em"
            height="0.95em"
            className="inline-block translate-y-0.5"
            aria-hidden="true"
          />
        )}
      </Link>
    )
  }
)
RichLink.displayName = 'RichLink'
