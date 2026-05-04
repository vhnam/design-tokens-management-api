import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne, notInArray } from 'drizzle-orm';

import type { Database } from '../config/db.config';
import { DATABASE } from '../database/database.constants';
import { tokenFiles } from '../schema/tokens.schema';

import type {
  CreateProjectDto,
  ProjectDto,
  UpdateProjectDto,
} from './project.dto';

/** Reserved `token_files` rows bootstrapped for token APIs; hidden from projects CRUD. */
const INTERNAL_TOKEN_FILE_NAMES = [
  '__primitive_tokens__',
  '__semantic_tokens__',
  '__component_tokens__',
] as const;

function isReservedProjectName(name: string): boolean {
  return (INTERNAL_TOKEN_FILE_NAMES as readonly string[]).includes(name);
}

@Injectable()
export class ProjectService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    createProjectDto: CreateProjectDto,
    organizationId: string,
    ownerId: string,
  ): Promise<ProjectDto> {
    const name = this.normalizeRequiredName(createProjectDto.name);

    if (isReservedProjectName(name)) {
      throw new BadRequestException('This project name is reserved');
    }

    await this.ensureNameAvailable(organizationId, name);

    const description = this.normalizeOptionalDescription(
      createProjectDto.description,
    );

    const [created] = await this.db
      .insert(tokenFiles)
      .values({
        id: randomUUID(),
        name,
        description,
        ownerId,
        organizationId,
      })
      .returning();

    return created;
  }

  async findAll(organizationId: string): Promise<ProjectDto[]> {
    const rows = await this.db
      .select()
      .from(tokenFiles)
      .where(
        and(
          eq(tokenFiles.organizationId, organizationId),
          notInArray(tokenFiles.name, [...INTERNAL_TOKEN_FILE_NAMES]),
        ),
      );

    return rows;
  }

  async findOne(id: string, organizationId: string): Promise<ProjectDto> {
    const row = await this.findOwnedRowOrThrow(id, organizationId);

    return row;
  }

  async update(
    id: string,
    organizationId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectDto> {
    const existing = await this.findOwnedRowOrThrow(id, organizationId);

    if (
      updateProjectDto.name === undefined &&
      updateProjectDto.description === undefined
    ) {
      throw new BadRequestException('No fields to update');
    }

    const values: Partial<{
      name: string;
      description: string | null;
      updatedAt: Date;
    }> = { updatedAt: new Date() };

    if (updateProjectDto.name !== undefined) {
      const nextName = this.normalizeRequiredName(updateProjectDto.name);
      if (isReservedProjectName(nextName)) {
        throw new BadRequestException('This project name is reserved');
      }
      if (nextName !== existing.name) {
        await this.ensureNameAvailable(organizationId, nextName, id);
      }
      values.name = nextName;
    }

    if (updateProjectDto.description !== undefined) {
      values.description = this.normalizeOptionalDescription(
        updateProjectDto.description,
      );
    }

    const [updated] = await this.db
      .update(tokenFiles)
      .set(values)
      .where(
        and(
          eq(tokenFiles.id, id),
          eq(tokenFiles.organizationId, organizationId),
        ),
      )
      .returning();

    return updated;
  }

  async remove(id: string, organizationId: string): Promise<{ deleted: true }> {
    await this.findOwnedRowOrThrow(id, organizationId);

    await this.db
      .delete(tokenFiles)
      .where(
        and(
          eq(tokenFiles.id, id),
          eq(tokenFiles.organizationId, organizationId),
        ),
      );

    return { deleted: true };
  }

  private async findOwnedRowOrThrow(
    id: string,
    organizationId: string,
  ): Promise<typeof tokenFiles.$inferSelect> {
    const [found] = await this.db
      .select()
      .from(tokenFiles)
      .where(
        and(
          eq(tokenFiles.id, id),
          eq(tokenFiles.organizationId, organizationId),
        ),
      );

    if (!found) {
      throw new NotFoundException('Project not found');
    }

    if (isReservedProjectName(found.name)) {
      throw new NotFoundException('Project not found');
    }

    return found;
  }

  private async ensureNameAvailable(
    organizationId: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const conditions = excludeId
      ? and(
          eq(tokenFiles.organizationId, organizationId),
          eq(tokenFiles.name, name),
          ne(tokenFiles.id, excludeId),
        )
      : and(
          eq(tokenFiles.organizationId, organizationId),
          eq(tokenFiles.name, name),
        );

    const [conflict] = await this.db
      .select({ id: tokenFiles.id })
      .from(tokenFiles)
      .where(conditions)
      .limit(1);

    if (conflict) {
      throw new ConflictException(
        'A project with this name already exists in the organization',
      );
    }
  }

  private normalizeRequiredName(name: string): string {
    const normalized = name?.trim();
    if (!normalized) {
      throw new BadRequestException('Project name is required');
    }

    return normalized;
  }

  private normalizeOptionalDescription(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
}
