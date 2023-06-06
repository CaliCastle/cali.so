import Hashids from 'hashids'
import { z } from 'zod'

export const CommentDtoSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  body: z.object({
    blockId: z.string().optional(),
    text: z.string().min(1),
  }),
  userInfo: z.object({
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
  }),
  parentId: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()),
})
export type CommentDto = z.infer<typeof CommentDtoSchema>
export type PostIDLessCommentDto = Omit<CommentDto, 'postId'>
export const CommentHashids = new Hashids('comments')
