import type { Config } from 'drizzle-kit'

export default {
  schema: './src/main/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    // Use the same path as runtime development environment
    url: './.local-dev/app.db'
  },
  verbose: true,
  strict: true
} satisfies Config

