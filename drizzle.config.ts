import * as dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'
dotenv.config()

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  connectionString: process.env.DATABASE_URL,
} satisfies Config
