import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from '../schema';

import { env, getRequiredEnvValue } from './env.config';

type DatabaseEnvKey =
  | 'DATABASE_URL'
  | 'DB_USER'
  | 'DB_PASSWORD'
  | 'DB_HOST'
  | 'DB_PORT'
  | 'DB_NAME';

type DatabaseRuntimeEnv = Partial<Record<DatabaseEnvKey, string>>;

export function getDatabaseUrlFromEnv(runtimeEnv: DatabaseRuntimeEnv): string {
  if (runtimeEnv.DATABASE_URL) {
    return runtimeEnv.DATABASE_URL;
  }

  const user = getRequiredEnvValue<DatabaseRuntimeEnv>(runtimeEnv, 'DB_USER');
  const password = getRequiredEnvValue<DatabaseRuntimeEnv>(
    runtimeEnv,
    'DB_PASSWORD',
  );
  const host = getRequiredEnvValue<DatabaseRuntimeEnv>(runtimeEnv, 'DB_HOST');
  const port = getRequiredEnvValue<DatabaseRuntimeEnv>(runtimeEnv, 'DB_PORT');
  const dbName = getRequiredEnvValue<DatabaseRuntimeEnv>(runtimeEnv, 'DB_NAME');

  return `postgres://${user}:${password}@${host}:${port}/${dbName}`;
}

const pool = new Pool({
  connectionString: getDatabaseUrlFromEnv(env),
});

export const db = drizzle(pool, { schema });
export type Database = typeof db;
