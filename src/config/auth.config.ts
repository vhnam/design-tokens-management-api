import type { BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { db } from '../config/db.config';
import { env } from '../config/env.config';
import * as schema from '../schema/auth.schema';

const frontendOrigin = new URL(env.CORS_ORIGIN).origin;

export const authConfig: BetterAuthOptions = {
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: [frontendOrigin],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
  },
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
  },
  emailVerification: {
    sendOnSignUp: true,
  },
};
