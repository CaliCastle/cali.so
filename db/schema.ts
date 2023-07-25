import {
  bigint,
  datetime,
  index,
  json,
  mysqlTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/mysql-core'

export const subscribers = mysqlTable('subscribers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 120 }),
  token: varchar('token', { length: 50 }),
  subscribedAt: datetime('subscribed_at'),
  unsubscribedAt: datetime('unsubscribed_at'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
})

export const newsletters = mysqlTable('newsletters', {
  id: serial('id').primaryKey(),
  subject: varchar('subject', { length: 200 }),
  body: text('body'),
  sentAt: datetime('sent_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
})

export const comments = mysqlTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    userId: varchar('user_id', { length: 200 }).notNull(),
    userInfo: json('user_info'),
    postId: varchar('post_id', { length: 100 }).notNull(),
    parentId: bigint('parent_id', { mode: 'bigint' }),
    body: json('body'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  (table) => ({
    postIdx: index('post_idx').on(table.postId),
  })
)

export const guestbook = mysqlTable('guestbook', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 200 }).notNull(),
  userInfo: json('user_info'),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
})
