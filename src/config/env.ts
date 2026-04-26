import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

function getRequiredValue(
  value: string | undefined,
  name: 'DB_USER' | 'DB_PASSWORD' | 'DB_HOST' | 'DB_PORT' | 'DB_NAME',
): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const baseEnv = createEnv({
  server: {
    API_PORT: z.coerce.number().int().positive(),
    CORS_ORIGIN: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    DATABASE_URL: z.string().min(1).optional(),
    DB_USER: z.string().min(1).optional(),
    DB_PASSWORD: z.string().min(1).optional(),
    DB_HOST: z.string().min(1).optional(),
    DB_PORT: z.string().min(1).optional(),
    DB_NAME: z.string().min(1).optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export function getDatabaseUrl(): string {
  if (baseEnv.DATABASE_URL) {
    return baseEnv.DATABASE_URL;
  }

  const user = getRequiredValue(baseEnv.DB_USER, 'DB_USER');
  const password = getRequiredValue(baseEnv.DB_PASSWORD, 'DB_PASSWORD');
  const host = getRequiredValue(baseEnv.DB_HOST, 'DB_HOST');
  const port = getRequiredValue(baseEnv.DB_PORT, 'DB_PORT');
  const dbName = getRequiredValue(baseEnv.DB_NAME, 'DB_NAME');

  return `postgres://${user}:${password}@${host}:${port}/${dbName}`;
}

export const env = {
  ...baseEnv,
  DATABASE_URL: getDatabaseUrl(),
};
