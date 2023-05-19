import { createClient } from '@liveblocks/client'
import type { WithLiveblocks } from '@liveblocks/zustand'
import { liveblocks } from '@liveblocks/zustand'
import { create } from 'zustand'

import { env } from '~/env.mjs'

const client = createClient({
  publicApiKey: env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY,
})

type Cursor = { x: number; y: number; isDown?: boolean }

type Presence = {
  roomId?: string
  cursor: Cursor | null
  setRoomId: (roomId: string | undefined) => void
  setCursor: (cursor: Cursor | null) => void
}

export const usePresenceStore = create<WithLiveblocks<Presence>>()(
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

type PostState = {
  likes: number
  hearts: number
  claps: number
  addLike: () => void
  addHeart: () => void
  addClap: () => void
}
export const usePostStore = create<WithLiveblocks<PostState>>()(
  liveblocks(
    (set) => ({
      likes: 0,
      hearts: 0,
      claps: 0,
      addLike: () => set((state) => ({ likes: state.likes + 1 })),
      addHeart: () => set((state) => ({ hearts: state.hearts + 1 })),
      addClap: () => set((state) => ({ claps: state.claps + 1 })),
    }),
    {
      client,
      storageMapping: { likes: true, hearts: true, claps: true },
    }
  )
)
