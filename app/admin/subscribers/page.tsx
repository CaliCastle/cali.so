import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Title,
} from '@tremor/react'
import { parseDateTime } from '@zolplay/utils'
import { desc, lte, sql } from 'drizzle-orm'
import React from 'react'

import { db } from '~/db'
import { subscribers } from '~/db/schema'

export default async function AdminSubscribersPage() {
  const {
    rows: [count],
  } = await db.execute<{ total: number }>(
    sql`SELECT 
  (SELECT COUNT(*) FROM subscribers WHERE subscribed_at IS NOT NULL) as total`
  )
  const subs = await db
    .select()
    .from(subscribers)
    .where(lte(subscribers.subscribedAt, new Date()))
    .limit(30)
    .orderBy(desc(subscribers.subscribedAt))

  return (
    <>
      <Title>
        总订阅{' '}
        {typeof count === 'object' && 'total' in count && (
          <span>{count.total}</span>
        )}
      </Title>

      <Card className="mt-6">
        <Table className="mt-5">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>订阅时间</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subs.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.email}</TableCell>
                <TableCell>
                  {parseDateTime({ date: sub.subscribedAt })?.format(
                    'YYYY-MM-DD HH:mm'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
