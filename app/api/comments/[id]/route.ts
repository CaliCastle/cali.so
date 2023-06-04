import { currentUser } from '@clerk/nextjs'
import { asc, eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '~/db'
import {
  type CommentDto,
  CommentHashids,
  type PostIDLessCommentDto,
} from '~/db/dto/comment.dto'
import { comments } from '~/db/schema'
import { client } from '~/sanity/lib/client'

type Params = { params: { id: string } }
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const postId = params.id

    const data = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        userInfo: comments.userInfo,
        body: comments.body,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(asc(comments.createdAt))

    return NextResponse.json(
      data.map(
        ({ id, ...rest }) =>
          ({
            ...rest,
            id: CommentHashids.encode(id),
          } as PostIDLessCommentDto)
      )
    )
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 })
  }
}

const CreateCommentSchema = z.object({
  body: z.object({
    blockId: z.string().optional(),
    text: z.string().min(1).max(500),
  }),
})

export async function POST(req: NextRequest, { params }: Params) {
  const user = await currentUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const postId = params.id
  const postExists = await client.fetch<number>(
    'count(*[_type == "post" && _id == $id])',
    {
      id: postId,
    }
  )
  if (!postExists) {
    return NextResponse.json({ error: 'Post not found' }, { status: 412 })
  }

  try {
    const data = await req.json()
    const { body } = CreateCommentSchema.parse(data)

    const commentData = {
      postId,
      userId: user.id,
      body,
      userInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      },
    }
    const { insertId } = await db.insert(comments).values(commentData)

    return NextResponse.json({
      ...commentData,
      id: CommentHashids.encode(insertId),
      createdAt: new Date(),
    } satisfies CommentDto)
  } catch (error) {
    return NextResponse.json({ error }, { status: 400 })
  }
}

export const runtime = 'edge'
export const preferredRegion = 'sin1'
