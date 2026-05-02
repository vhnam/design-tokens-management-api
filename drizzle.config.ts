import 'dotenv/config';
import type { Config } from 'drizzle-kit';

import { getDatabaseUrlFromEnv } from './src/config/db.config';
import { env } from './src/config/env.config';

export default {
  schema: [
    './src/schema/auth.schema.ts',
    './src/schema/tokens.schema.ts',
    './src/schema/workspaces.schema.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrlFromEnv(env),
  },
} satisfies Config;
