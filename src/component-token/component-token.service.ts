import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import type { Database } from '../config/db.config';
import { DATABASE } from '../database/database.constants';
import { componentToken } from '../schema/component-token';

import type {
  ComponentTokenDto,
  CreateComponentTokenDto,
  UpdateComponentTokenDto,
} from './component-token.dto';

type CreateComponentTokenInput = CreateComponentTokenDto & {
  workspaceId: string;
};

@Injectable()
export class ComponentTokenService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    createComponentTokenDto: CreateComponentTokenInput,
  ): Promise<ComponentTokenDto> {
    const name = this.normalizeRequiredField(
      createComponentTokenDto.name,
      'Component token name is required',
    );
    const type = this.normalizeRequiredField(
      createComponentTokenDto.type,
      'Component token type is required',
    );
    const description = this.normalizeOptionalField(
      createComponentTokenDto.description,
    );
    const workspaceId = this.normalizeRequiredField(
      createComponentTokenDto.workspaceId,
      'Component token workspace is required',
    );

    const [created] = await this.db
      .insert(componentToken)
      .values({
        id: randomUUID(),
        name,
        type,
        description,
        workspaceId,
      })
      .returning();

    return created;
  }

  async findAll(workspaceId: string): Promise<ComponentTokenDto[]> {
    return this.db
      .select()
      .from(componentToken)
      .where(eq(componentToken.workspaceId, workspaceId));
  }

  async findOne(id: string, workspaceId: string): Promise<ComponentTokenDto> {
    const [found] = await this.db
      .select()
      .from(componentToken)
      .where(
        and(
          eq(componentToken.id, id),
          eq(componentToken.workspaceId, workspaceId),
        ),
      );

    if (!found) {
      throw new NotFoundException('Component token not found');
    }

    return found;
  }

  async update(
    id: string,
    workspaceId: string,
    updateComponentTokenDto: UpdateComponentTokenDto,
  ): Promise<ComponentTokenDto> {
    await this.ensureExists(id, workspaceId);

    const values: Partial<
      Pick<ComponentTokenDto, 'name' | 'type' | 'description'>
    > = {};

    if (updateComponentTokenDto.name !== undefined) {
      values.name = this.normalizeRequiredField(
        updateComponentTokenDto.name,
        'Component token name is required',
      );
    }

    if (updateComponentTokenDto.type !== undefined) {
      values.type = this.normalizeRequiredField(
        updateComponentTokenDto.type,
        'Component token type is required',
      );
    }

    if (updateComponentTokenDto.description !== undefined) {
      values.description = this.normalizeOptionalField(
        updateComponentTokenDto.description,
      );
    }

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const [updated] = await this.db
      .update(componentToken)
      .set(values)
      .where(
        and(
          eq(componentToken.id, id),
          eq(componentToken.workspaceId, workspaceId),
        ),
      )
      .returning();

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ deleted: true }> {
    await this.ensureExists(id, workspaceId);
    await this.db
      .delete(componentToken)
      .where(
        and(
          eq(componentToken.id, id),
          eq(componentToken.workspaceId, workspaceId),
        ),
      );

    return { deleted: true };
  }

  private async ensureExists(id: string, workspaceId: string): Promise<void> {
    const [found] = await this.db
      .select({ id: componentToken.id })
      .from(componentToken)
      .where(
        and(
          eq(componentToken.id, id),
          eq(componentToken.workspaceId, workspaceId),
        ),
      );

    if (!found) {
      throw new NotFoundException('Component token not found');
    }
  }

  private normalizeRequiredField(value: string, message: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeOptionalField(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
}
