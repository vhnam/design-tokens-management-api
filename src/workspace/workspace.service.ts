import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { db } from '../config/db';
import { workspace } from '../schema/workspace';

import type {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceDto,
} from './workspace.dto';

@Injectable()
export class WorkspaceService {
  async create(createWorkspaceDto: CreateWorkspaceDto): Promise<WorkspaceDto> {
    const name = this.normalizeName(createWorkspaceDto.name);
    const image = this.normalizeImage(createWorkspaceDto.image);

    const [created] = await db
      .insert(workspace)
      .values({
        id: randomUUID(),
        name,
        image,
      })
      .returning();

    return created;
  }

  async findAll(): Promise<WorkspaceDto[]> {
    return db.select().from(workspace);
  }

  async findOne(id: string): Promise<WorkspaceDto> {
    const [found] = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, id));

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

    const [updated] = await db
      .update(workspace)
      .set(values)
      .where(eq(workspace.id, id))
      .returning();

    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    await this.ensureExists(id);
    await db.delete(workspace).where(eq(workspace.id, id));

    return { deleted: true };
  }

  private async ensureExists(id: string): Promise<void> {
    const [found] = await db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.id, id));

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
