import { datetime, mysqlTable, serial, varchar } from 'drizzle-orm/mysql-core'

export const subscribers = mysqlTable('subscribers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 120 }),
  token: varchar('token', { length: 50 }),
  subscribedAt: datetime('subscribed_at'),
})
