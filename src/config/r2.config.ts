import { getRequiredEnvValue } from './env.config';

type R2EnvKey =
  | 'CLOUDFLARE_ACCOUNT_ID'
  | 'CLOUDFLARE_R2_ACCESS_TOKEN'
  | 'CLOUDFLARE_R2_SECRET_ACCESS_TOKEN'
  | 'CLOUDFLARE_R2_BUCKET_NAME'
  | 'CLOUDFLARE_R2_PUBLIC_URL';

export type R2RuntimeEnv = Partial<Record<R2EnvKey, string>>;

export function getR2ConfigFromEnv(runtimeEnv: R2RuntimeEnv) {
  const accountId = getRequiredEnvValue<R2RuntimeEnv>(
    runtimeEnv,
    'CLOUDFLARE_ACCOUNT_ID',
  );
  const accessKeyId = getRequiredEnvValue<R2RuntimeEnv>(
    runtimeEnv,
    'CLOUDFLARE_R2_ACCESS_TOKEN',
  );
  const secretAccessKey = getRequiredEnvValue<R2RuntimeEnv>(
    runtimeEnv,
    'CLOUDFLARE_R2_SECRET_ACCESS_TOKEN',
  );
  const bucket = getRequiredEnvValue<R2RuntimeEnv>(
    runtimeEnv,
    'CLOUDFLARE_R2_BUCKET_NAME',
  );
  const publicBaseUrl = getRequiredEnvValue<R2RuntimeEnv>(
    runtimeEnv,
    'CLOUDFLARE_R2_PUBLIC_URL',
  );

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  };
}
