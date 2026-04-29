import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { Database } from '../config/db.config';
import { DATABASE } from '../database/database.constants';
import { MediaService } from '../media/media.service';
import { user } from '../schema/auth';

@Injectable()
export class UserService {
  constructor(
    private readonly mediaService: MediaService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async createAvatarUploadUrl(
    userId: string,
    extension: string,
    contentType: string,
  ) {
    const normalizedExt = this.normalizeExtension(extension);
    this.validateContentType(contentType);
    const key = `users/${userId}.${normalizedExt}`;

    return this.mediaService.createUploadUrl(key, contentType, 300);
  }

  async saveAvatarImage(userId: string, extension: string) {
    const normalizedExt = this.normalizeExtension(extension);
    const key = `users/${userId}.${normalizedExt}`;
    const imageUrl = this.mediaService.getPublicUrl(key);

    await this.db
      .update(user)
      .set({
        image: imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return { image: imageUrl };
  }

  async updateProfile(userId: string, profile: { name?: string }) {
    const trimmedName = profile.name?.trim();

    if (trimmedName === undefined) {
      throw new BadRequestException('No updatable fields provided');
    }

    if (!trimmedName) {
      throw new BadRequestException('Name is required');
    }

    await this.db
      .update(user)
      .set({
        name: trimmedName,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    return { name: trimmedName };
  }

  private normalizeExtension(extension: string): string {
    const normalized = extension.trim().replace(/^\.+/, '').toLowerCase();
    const allowedExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

    if (!allowedExtensions.has(normalized)) {
      throw new BadRequestException('Unsupported image extension');
    }

    return normalized === 'jpeg' ? 'jpg' : normalized;
  }

  private validateContentType(contentType: string): void {
    const normalized = contentType.trim().toLowerCase();
    const allowedContentTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);

    if (!allowedContentTypes.has(normalized)) {
      throw new BadRequestException('Unsupported image content type');
    }
  }
}
