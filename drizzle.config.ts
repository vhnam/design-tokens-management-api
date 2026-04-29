import 'dotenv/config';
import type { Config } from 'drizzle-kit';

import { getDatabaseUrlFromEnv } from './src/config/db.config';
import { env } from './src/config/env.config';

export default {
  schema: [
    './src/schema/auth.ts',
    './src/schema/workspace.ts',
    './src/schema/workspace-user.ts',
    './src/schema/primitive-token.ts',
    './src/schema/semantic-token.ts',
    './src/schema/component-token.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrlFromEnv(env),
  },
} satisfies Config;
