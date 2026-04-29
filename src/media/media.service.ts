import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

import { env } from '../config/env.config';
import { getR2ConfigFromEnv } from '../config/r2.config';

@Injectable()
export class MediaService {
  private readonly r2Config = getR2ConfigFromEnv(env);
  private readonly s3Client = new S3Client({
    region: 'auto',
    endpoint: this.r2Config.endpoint,
    credentials: {
      accessKeyId: this.r2Config.accessKeyId!,
      secretAccessKey: this.r2Config.secretAccessKey!,
    },
  });

  async createUploadUrl(key: string, contentType: string, expiresIn = 300) {
    const command = new PutObjectCommand({
      Bucket: this.r2Config.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key: `/${key}`,
      imageUrl: this.getPublicUrl(key),
      expiresIn,
    };
  }

  getPublicUrl(key: string): string {
    return `${this.r2Config.publicBaseUrl!.replace(/\/$/, '')}/${key}`;
  }
}
