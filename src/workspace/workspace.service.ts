import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import type { Database } from '../config/db.config';
import { DATABASE } from '../database/database.constants';
import { workspaceMembers, workspaces } from '../schema/workspaces.schema';

import type {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceDto,
} from './workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    createWorkspaceDto: CreateWorkspaceDto,
    userId: string,
  ): Promise<WorkspaceDto> {
    const name = this.normalizeName(createWorkspaceDto.name);
    const image = this.normalizeImage(createWorkspaceDto.image);
    const ownerId = userId;

    const [created] = await this.db
      .insert(workspaces)
      .values({
        id: randomUUID(),
        name,
        image,
        ownerId,
      })
      .returning();

    await this.db.insert(workspaceMembers).values({
      id: randomUUID(),
      workspaceId: created.id,
      userId,
      role: 'owner',
    });

    return created;
  }

  async findAll(): Promise<WorkspaceDto[]> {
    return this.db.select().from(workspaces);
  }

  async findOne(id: string): Promise<WorkspaceDto> {
    const [found] = await this.db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));

    if (!found) {
      throw new NotFoundException('Workspace not found');
    }

    return found;
  }

  async update(
    id: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ): Promise<WorkspaceDto> {
    await this.ensureExists(id);

    const values: Partial<Pick<WorkspaceDto, 'name' | 'image'>> = {};

    if (updateWorkspaceDto.name !== undefined) {
      values.name = this.normalizeName(updateWorkspaceDto.name);
    }

    if (updateWorkspaceDto.image !== undefined) {
      values.image = this.normalizeImage(updateWorkspaceDto.image);
    }

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const [updated] = await this.db
      .update(workspaces)
      .set(values)
      .where(eq(workspaces.id, id))
      .returning();

    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    await this.ensureExists(id);
    await this.db.delete(workspaces).where(eq(workspaces.id, id));

    return { deleted: true };
  }

  async findDefaultWorkspaceId(userId: string): Promise<string | null> {
    const [found] = await this.db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    return found?.workspaceId ?? null;
  }

  private async ensureExists(id: string): Promise<void> {
    const [found] = await this.db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.id, id));

    if (!found) {
      throw new NotFoundException('Workspace not found');
    }
  }

  private normalizeName(name: string): string {
    const normalized = name?.trim();
    if (!normalized) {
      throw new BadRequestException('Workspace name is required');
    }

    return normalized;
  }

  private normalizeImage(image?: string | null): string | null {
    if (image === undefined || image === null) {
      return null;
    }

    const normalized = image.trim();
    return normalized.length ? normalized : null;
  }
}
