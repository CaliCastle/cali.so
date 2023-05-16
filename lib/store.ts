import { createClient } from '@liveblocks/client'
import type { WithLiveblocks } from '@liveblocks/zustand'
import { liveblocks } from '@liveblocks/zustand'
import create from 'zustand'

import { env } from '~/env.mjs'

type State = {
  // Your Zustand state type will be defined here
}

const client = createClient({
  publicApiKey: env.NEXT_PUBLIC_LIVEBLOCKS_API_KEY,
})

const useStore = create<WithLiveblocks<State>>()(
  liveblocks(
    (set) => ({
      // Your state and actions will go here
    }),
    { client }
  )
)

export default useStore
