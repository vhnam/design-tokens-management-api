import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_PORT: z.coerce.number().int().positive(),
    CORS_ORIGIN: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    RESEND_API_KEY: z.string().min(1),
    RESEND_FROM_EMAIL: z.string().min(1),
    DATABASE_URL: z.string().min(1).optional(),
    DB_USER: z.string().min(1).optional(),
    DB_PASSWORD: z.string().min(1).optional(),
    DB_HOST: z.string().min(1).optional(),
    DB_PORT: z.string().min(1).optional(),
    DB_NAME: z.string().min(1).optional(),
    CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
    CLOUDFLARE_R2_ACCESS_TOKEN: z.string().min(1),
    CLOUDFLARE_R2_SECRET_ACCESS_TOKEN: z.string().min(1),
    CLOUDFLARE_R2_BUCKET_NAME: z.string().min(1),
    CLOUDFLARE_R2_PUBLIC_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export function getRequiredEnvValue<T extends Record<string, string>>(
  runtimeEnv: T,
  name: keyof T,
): T[keyof T] {
  const value = runtimeEnv[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name as string}`);
  }
  return value;
}
