import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, ne } from 'drizzle-orm';

import { isReservedInternalTokenFileName } from '../common/constants/internal-token-files';
import type { Database } from '../config/db.config';
import { DATABASE } from '../database/database.constants';
import { tokenFiles, tokenSets } from '../schema/tokens.schema';

import type {
  CreateTokenSetDto,
  TokenSetDto,
  UpdateTokenSetDto,
} from './token-set.dto';

@Injectable()
export class TokenSetService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    projectId: string,
    organizationId: string,
    createTokenSetDto: CreateTokenSetDto,
  ): Promise<TokenSetDto> {
    const name = this.normalizeRequiredName(createTokenSetDto.name);
    const order = this.normalizeOrder(createTokenSetDto.order);

    await this.assertAccessibleProjectFile(projectId, organizationId);
    await this.ensureSetNameAvailable(projectId, name);

    const [created] = await this.db
      .insert(tokenSets)
      .values({
        id: randomUUID(),
        fileId: projectId,
        name,
        order,
      })
      .returning();

    return created;
  }

  async findAll(
    projectId: string,
    organizationId: string,
  ): Promise<TokenSetDto[]> {
    await this.assertAccessibleProjectFile(projectId, organizationId);

    return this.db
      .select()
      .from(tokenSets)
      .where(eq(tokenSets.fileId, projectId))
      .orderBy(asc(tokenSets.order), asc(tokenSets.name));
  }

  async findOne(
    projectId: string,
    id: string,
    organizationId: string,
  ): Promise<TokenSetDto> {
    await this.assertAccessibleProjectFile(projectId, organizationId);

    const [row] = await this.db
      .select()
      .from(tokenSets)
      .where(and(eq(tokenSets.id, id), eq(tokenSets.fileId, projectId)));

    if (!row) {
      throw new NotFoundException('Token set not found');
    }

    return row;
  }

  async update(
    projectId: string,
    id: string,
    organizationId: string,
    updateTokenSetDto: UpdateTokenSetDto,
  ): Promise<TokenSetDto> {
    if (
      updateTokenSetDto.name === undefined &&
      updateTokenSetDto.order === undefined
    ) {
      throw new BadRequestException('No fields to update');
    }

    await this.assertAccessibleProjectFile(projectId, organizationId);

    const existing = await this.findOwnedSetOrThrow(projectId, id);

    const values: Partial<{
      name: string;
      order: number;
      updatedAt: Date;
    }> = { updatedAt: new Date() };

    if (updateTokenSetDto.name !== undefined) {
      const nextName = this.normalizeRequiredName(updateTokenSetDto.name);
      if (nextName !== existing.name) {
        await this.ensureSetNameAvailable(projectId, nextName, id);
      }
      values.name = nextName;
    }

    if (updateTokenSetDto.order !== undefined) {
      values.order = this.normalizeOrder(updateTokenSetDto.order);
    }

    const [updated] = await this.db
      .update(tokenSets)
      .set(values)
      .where(and(eq(tokenSets.id, id), eq(tokenSets.fileId, projectId)))
      .returning();

    return updated;
  }

  async remove(
    projectId: string,
    id: string,
    organizationId: string,
  ): Promise<{ deleted: true }> {
    await this.assertAccessibleProjectFile(projectId, organizationId);
    await this.findOwnedSetOrThrow(projectId, id);

    await this.db
      .delete(tokenSets)
      .where(and(eq(tokenSets.id, id), eq(tokenSets.fileId, projectId)));

    return { deleted: true };
  }

  private async assertAccessibleProjectFile(
    fileId: string,
    organizationId: string,
  ): Promise<void> {
    const [file] = await this.db
      .select({
        id: tokenFiles.id,
        name: tokenFiles.name,
        organizationId: tokenFiles.organizationId,
      })
      .from(tokenFiles)
      .where(
        and(
          eq(tokenFiles.id, fileId),
          eq(tokenFiles.organizationId, organizationId),
        ),
      );

    if (!file || isReservedInternalTokenFileName(file.name)) {
      throw new NotFoundException('Project not found');
    }
  }

  private async findOwnedSetOrThrow(
    projectId: string,
    id: string,
  ): Promise<typeof tokenSets.$inferSelect> {
    const [row] = await this.db
      .select()
      .from(tokenSets)
      .where(and(eq(tokenSets.id, id), eq(tokenSets.fileId, projectId)));

    if (!row) {
      throw new NotFoundException('Token set not found');
    }

    return row;
  }

  private async ensureSetNameAvailable(
    fileId: string,
    name: string,
    excludeSetId?: string,
  ): Promise<void> {
    const conditions = excludeSetId
      ? and(
          eq(tokenSets.fileId, fileId),
          eq(tokenSets.name, name),
          ne(tokenSets.id, excludeSetId),
        )
      : and(eq(tokenSets.fileId, fileId), eq(tokenSets.name, name));

    const [conflict] = await this.db
      .select({ id: tokenSets.id })
      .from(tokenSets)
      .where(conditions)
      .limit(1);

    if (conflict) {
      throw new ConflictException(
        'A token set with this name already exists in the project',
      );
    }
  }

  private normalizeRequiredName(name: string): string {
    const normalized = name?.trim();
    if (!normalized) {
      throw new BadRequestException('Token set name is required');
    }

    return normalized;
  }

  private normalizeOrder(value?: number): number {
    if (value === undefined || value === null) {
      return 0;
    }

    if (!Number.isInteger(value)) {
      throw new BadRequestException('Token set order must be an integer');
    }

    return value;
  }
}
