import { proxy } from 'valtio'

import { type GuestbookDto } from '~/db/dto/guestbook.dto'

export const guestbookState = proxy<{
  messages: GuestbookDto[]
}>({
  messages: [],
})

export function signBook(message: GuestbookDto, appends = false) {
  if (appends) {
    // append message to the end
    guestbookState.messages.push(message)
  } else {
    // insert message at index 0
    guestbookState.messages.splice(0, 0, message)
  }
}
