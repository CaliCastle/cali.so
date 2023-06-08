import { proxy } from 'valtio'

import { type GuestbookDto } from '~/db/dto/guestbook.dto'

export const guestbookState = proxy<{
  messages: GuestbookDto[]
}>({
  messages: [],
})

export function sortMessages() {
  // reorder messages by date
  guestbookState.messages.sort((a, b) => {
    if (typeof a.createdAt !== 'string' || typeof b.createdAt !== 'string') {
      return 0
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export function signBook(message: GuestbookDto, sorts = false) {
  // insert message at index 0
  guestbookState.messages.push(message)

  if (sorts) {
    sortMessages()
  }
}
