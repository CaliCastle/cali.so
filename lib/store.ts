import { createClient } from '@liveblocks/client'
import type { WithLiveblocks } from '@liveblocks/zustand'
import { liveblocks } from '@liveblocks/zustand'
import { create } from 'zustand'

import { env } from '~/env.mjs'

type Cursor = { x: number; y: number; isDown?: boolean }

type State = {
  roomId?: string
  cursor: Cursor | null
  setRoomId: (roomId: string | undefined) => void
  setCursor: (cursor: Cursor | null) => void
}

const client = createClient({
  publicApiKey: env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY,
})

export const usePostPresenceStore = create<WithLiveblocks<State>>()(
  liveblocks(
    (set) => ({
      roomId: undefined,
      cursor: null,
      setRoomId: (roomId) => set({ roomId }),
      setCursor: (cursor) => set({ cursor }),
    }),
    { client, presenceMapping: { cursor: true } }
  )
)
