import type { Config } from 'drizzle-kit';

export default {
  schema: [
    './src/schema/auth.ts',
    './src/schema/workspace.ts',
    './src/schema/primitive-token.ts',
    './src/schema/semantic-token.ts',
    './src/schema/component-token.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,
  },
} satisfies Config;
