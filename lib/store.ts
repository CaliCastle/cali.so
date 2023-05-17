import { createClient } from '@liveblocks/client'
import type { WithLiveblocks } from '@liveblocks/zustand'
import { liveblocks } from '@liveblocks/zustand'
import { create } from 'zustand'

import { env } from '~/env.mjs'

type Cursor = { x: number; y: number }

type State = {
  cursor: Cursor
  setCursor: (cursor: Cursor) => void
}

const client = createClient({
  publicApiKey: env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY,
})

export const useLivePostStore = create<WithLiveblocks<State>>()(
  liveblocks(
    (set) => ({
      cursor: { x: 0, y: 0 },
      setCursor: (cursor) => set({ cursor }),
    }),
    { client, presenceMapping: { cursor: true } }
  )
)
