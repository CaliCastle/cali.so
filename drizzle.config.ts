import * as dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'
dotenv.config()

export default {
  driver: 'mysql2',
  schema: './db/schema.ts',
  out: './db/migrations',
  dbCredentials: { connectionString: process.env.DATABASE_URL || '' },
} satisfies Config
