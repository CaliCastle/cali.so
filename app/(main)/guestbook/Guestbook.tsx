'use client'

import { SignedIn, SignedOut } from '@clerk/nextjs'

import { GuestbookFeeds } from './GuestbookFeeds'
import { GuestbookInput } from './GuestbookInput'

export function Guestbook() {
  return (
    <section className="max-w-2xl">
      <SignedOut>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          你需要登录才能留言。
        </p>
      </SignedOut>
      <SignedIn>
        <GuestbookInput />
      </SignedIn>

      <GuestbookFeeds />
    </section>
  )
}
