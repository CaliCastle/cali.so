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
import { desc, sql } from 'drizzle-orm'

import { Button } from '~/components/ui/Button'
import { db } from '~/db'
import { newsletters } from '~/db/schema'

export default async function AdminNewslettersPage() {
  const {
    rows: [count],
  } = await db.execute<{ today_count: number }>(
    sql`SELECT 
  (SELECT COUNT(*) FROM newsletters) as total`
  )
  const nl = await db
    .select()
    .from(newsletters)
    .limit(100)
    .orderBy(desc(newsletters.sentAt))

  return (
    <>
      <Title className="mb-3">
        Total newsletters{' '}
        {typeof count === 'object' && 'total' in count && (
          <span>{count.total}</span>
        )}
      </Title>
      <Button href="newsletters/new">New</Button>

      <Card className="mt-6">
        <Table className="mt-5">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Subject</TableHeaderCell>
              <TableHeaderCell>Time</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nl.map((newsletter) => (
              <TableRow key={newsletter.id}>
                <TableCell>{newsletter.subject}</TableCell>
                <TableCell>
                  {parseDateTime({ date: newsletter.sentAt })?.format(
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
