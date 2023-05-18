import { createClient } from '@liveblocks/client'
import type { WithLiveblocks } from '@liveblocks/zustand'
import { liveblocks } from '@liveblocks/zustand'
import { create } from 'zustand'

import { env } from '~/env.mjs'

const client = createClient({
  publicApiKey: env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY,
})

type Cursor = { x: number; y: number; isDown?: boolean }

type PostPresence = {
  roomId?: string
  cursor: Cursor | null
  setRoomId: (roomId: string | undefined) => void
  setCursor: (cursor: Cursor | null) => void
}

export const usePostPresenceStore = create<WithLiveblocks<PostPresence>>()(
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
  cries: number
  claps: number
  setLikes: (likes: number) => void
  setHearts: (hearts: number) => void
  setCries: (cries: number) => void
  setClaps: (claps: number) => void
}
export const usePostStore = create<WithLiveblocks<PostState>>()(
  liveblocks(
    (set) => ({
      likes: 0,
      hearts: 0,
      cries: 0,
      claps: 0,
      setLikes: (likes) => set({ likes }),
      setHearts: (hearts) => set({ hearts }),
      setCries: (cries) => set({ cries }),
      setClaps: (claps) => set({ claps }),
    }),
    {
      client,
      storageMapping: { likes: true, hearts: true, cries: true, claps: true },
    }
  )
)
