import { proxy } from 'valtio'

import { type PostIDLessCommentDto } from '~/db/dto/comment.dto'

type PostID = string
export const blogPostState = proxy<{
  postId: PostID
  comments: PostIDLessCommentDto[]
}>({
  postId: '',
  comments: [],
})

export function addComment(comment: PostIDLessCommentDto) {
  blogPostState.comments.push(comment)
}
