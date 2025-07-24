import type { Config } from 'drizzle-kit';

export default {
  schema: ['./src/modules/document/document.schema.ts', './src/modules/user/user.schema.ts'], // path to your schema file(s)
  out: './drizzle/migrations', // where to put migration files
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/your_db_name',
  },
} satisfies Config;
