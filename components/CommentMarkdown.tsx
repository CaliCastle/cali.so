'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { RichLink } from '~/components/links/RichLink'

export function CommentMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, href }) => {
          const rel = !href?.startsWith('/') ? 'noreferrer noopener' : undefined
          return (
            <RichLink
              href={href ?? ''}
              rel={rel}
              className="font-bold text-zinc-800 hover:underline dark:text-zinc-100"
            >
              {children}
            </RichLink>
          )
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
