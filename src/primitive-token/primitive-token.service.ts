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
import { primitiveToken } from '../schema/primitive-token';

import type {
  CreatePrimitiveTokenDto,
  PrimitiveTokenDto,
  UpdatePrimitiveTokenDto,
} from './primitive-token.dto';

type CreatePrimitiveTokenInput = CreatePrimitiveTokenDto & {
  workspaceId: string;
};

@Injectable()
export class PrimitiveTokenService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    createPrimitiveTokenDto: CreatePrimitiveTokenInput,
  ): Promise<PrimitiveTokenDto> {
    const name = this.normalizeRequiredField(
      createPrimitiveTokenDto.name,
      'Primitive token name is required',
    );
    const type = this.normalizeRequiredField(
      createPrimitiveTokenDto.type,
      'Primitive token type is required',
    );
    const description = this.normalizeOptionalField(
      createPrimitiveTokenDto.description,
    );
    const workspaceId = this.normalizeRequiredField(
      createPrimitiveTokenDto.workspaceId,
      'Primitive token workspace is required',
    );

    const [created] = await this.db
      .insert(primitiveToken)
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

  async findAll(workspaceId: string): Promise<PrimitiveTokenDto[]> {
    return this.db
      .select()
      .from(primitiveToken)
      .where(eq(primitiveToken.workspaceId, workspaceId));
  }

  async findOne(id: string, workspaceId: string): Promise<PrimitiveTokenDto> {
    const [found] = await this.db
      .select()
      .from(primitiveToken)
      .where(
        and(
          eq(primitiveToken.id, id),
          eq(primitiveToken.workspaceId, workspaceId),
        ),
      );

    if (!found) {
      throw new NotFoundException('Primitive token not found');
    }

    return found;
  }

  async update(
    id: string,
    workspaceId: string,
    updatePrimitiveTokenDto: UpdatePrimitiveTokenDto,
  ): Promise<PrimitiveTokenDto> {
    await this.ensureExists(id, workspaceId);

    const values: Partial<
      Pick<PrimitiveTokenDto, 'name' | 'type' | 'description'>
    > = {};

    if (updatePrimitiveTokenDto.name !== undefined) {
      values.name = this.normalizeRequiredField(
        updatePrimitiveTokenDto.name,
        'Primitive token name is required',
      );
    }

    if (updatePrimitiveTokenDto.type !== undefined) {
      values.type = this.normalizeRequiredField(
        updatePrimitiveTokenDto.type,
        'Primitive token type is required',
      );
    }

    if (updatePrimitiveTokenDto.description !== undefined) {
      values.description = this.normalizeOptionalField(
        updatePrimitiveTokenDto.description,
      );
    }

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const [updated] = await this.db
      .update(primitiveToken)
      .set(values)
      .where(
        and(
          eq(primitiveToken.id, id),
          eq(primitiveToken.workspaceId, workspaceId),
        ),
      )
      .returning();

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ deleted: true }> {
    await this.ensureExists(id, workspaceId);
    await this.db
      .delete(primitiveToken)
      .where(
        and(
          eq(primitiveToken.id, id),
          eq(primitiveToken.workspaceId, workspaceId),
        ),
      );

    return { deleted: true };
  }

  private async ensureExists(id: string, workspaceId: string): Promise<void> {
    const [found] = await this.db
      .select({ id: primitiveToken.id })
      .from(primitiveToken)
      .where(
        and(
          eq(primitiveToken.id, id),
          eq(primitiveToken.workspaceId, workspaceId),
        ),
      );

    if (!found) {
      throw new NotFoundException('Primitive token not found');
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
