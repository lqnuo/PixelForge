import type { Config } from 'drizzle-kit'

export default {
  schema: './src/main/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    // During dev, drizzle-kit works on a path; at runtime we use Electron userData
    url: './.local-dev/app.db'
  },
  verbose: true,
  strict: true
} satisfies Config

