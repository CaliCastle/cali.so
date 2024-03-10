import * as dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'
dotenv.config()

export default {
  driver: 'pg',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: { connectionString: process.env.DATABASE_URL || '' },
} satisfies Config
