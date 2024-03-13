import {
  Card,
  Grid,
  Metric,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  Title,
} from '@tremor/react'
import { desc, sql } from 'drizzle-orm'
import Link from 'next/link'
import React from 'react'

import { db } from '~/db'
import { comments } from '~/db/schema'
import { url } from '~/lib'
import { truncate } from '~/lib/string'
import { client } from '~/sanity/lib/client'

export default async function AdminCommentsPage() {
  const {
    rows: [commentsCount],
  } = await db.execute<{
    today_count: number
    this_week_count: number
    this_month_count: number
  }>(
    sql`SELECT 
  (SELECT COUNT(*) FROM comments WHERE created_at::date = CURRENT_DATE) AS today_count,
  (SELECT COUNT(*) FROM comments WHERE EXTRACT('YEAR' FROM created_at) = EXTRACT('YEAR' FROM CURRENT_DATE) AND EXTRACT('WEEK' FROM created_at) = EXTRACT('WEEK' FROM CURRENT_DATE)) AS this_week_count,
  (SELECT COUNT(*) FROM comments WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE) AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)) AS this_month_count`
  )

  const latestComments = await db
    .select()
    .from(comments)
    .orderBy(desc(comments.createdAt))
    .limit(15)
  // get unique post IDs from comments
  const postIds = [...new Set(latestComments.map((comment) => comment.postId))]
  const posts = await client.fetch<
    { _id: string; title: string; slug: string }[]
  >(
    `*[_type == "post" && (_id in [${postIds
      .map((v) => `"${v}"`)
      .join(',')}])]{ _id, title, "slug":slug.current }`
  )
  // define a map with key of post IDs to posts
  const postMap = new Map(posts.map((post) => [post._id, post]))

  return (
    <>
      <Title>评论</Title>

      <Grid numItemsMd={2} numItemsLg={3} className="mt-6 gap-6">
        <Card>
          <Text>今日评论数</Text>

          {commentsCount && 'today_count' in commentsCount && (
            <Metric>{commentsCount.today_count}</Metric>
          )}
        </Card>
        <Card>
          <Text>本周评论数</Text>
          {commentsCount && 'this_week_count' in commentsCount && (
            <Metric>{commentsCount.this_week_count}</Metric>
          )}
        </Card>

        <Card>
          <Text>本月评论数</Text>
          {commentsCount && 'this_month_count' in commentsCount && (
            <Metric>{commentsCount.this_month_count}</Metric>
          )}
        </Card>
      </Grid>

      <Card className="mt-6">
        <Table className="mt-5">
          <TableHead>
            <TableRow>
              <TableHeaderCell>文章</TableHeaderCell>
              <TableHeaderCell>评论内容</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {latestComments.map((comment) => (
              <TableRow key={comment.id}>
                <TableCell>
                  <Link
                    href={
                      url(`/blog/${postMap.get(comment.postId)?.slug ?? ''}`)
                        .href
                    }
                  >
                    {postMap.get(comment.postId)?.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Text>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {truncate((comment.body as any).text as string)}
                  </Text>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
