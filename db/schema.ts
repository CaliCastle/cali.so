import {
  datetime,
  index,
  json,
  mysqlTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

export const subscribers = mysqlTable('subscribers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 120 }),
  token: varchar('token', { length: 50 }),
  subscribedAt: datetime('subscribed_at'),
  unsubscribedAt: datetime('unsubscribed_at'),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const comments = mysqlTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 200 }).notNull(),
    userInfo: json('user_info'),
    postId: varchar('post_id', { length: 100 }).notNull(),
    body: json('body'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    postIdx: index('post_idx').on(table.postId),
  })
)
