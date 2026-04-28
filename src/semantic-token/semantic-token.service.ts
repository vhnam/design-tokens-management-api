import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import type { Database } from '../config/db';
import { DATABASE } from '../database/database.constants';
import { semanticToken } from '../schema/semantic-token';

import type {
  CreateSemanticTokenDto,
  SemanticTokenDto,
  UpdateSemanticTokenDto,
} from './semantic-token.dto';

type CreateSemanticTokenInput = CreateSemanticTokenDto & {
  workspaceId: string;
};

@Injectable()
export class SemanticTokenService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(
    createSemanticTokenDto: CreateSemanticTokenInput,
  ): Promise<SemanticTokenDto> {
    const name = this.normalizeRequiredField(
      createSemanticTokenDto.name,
      'Semantic token name is required',
    );
    const type = this.normalizeRequiredField(
      createSemanticTokenDto.type,
      'Semantic token type is required',
    );
    const description = this.normalizeOptionalField(
      createSemanticTokenDto.description,
    );
    const workspaceId = this.normalizeRequiredField(
      createSemanticTokenDto.workspaceId,
      'Semantic token workspace is required',
    );

    const [created] = await this.db
      .insert(semanticToken)
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

  async findAll(workspaceId: string): Promise<SemanticTokenDto[]> {
    return this.db
      .select()
      .from(semanticToken)
      .where(eq(semanticToken.workspaceId, workspaceId));
  }

  async findOne(id: string, workspaceId: string): Promise<SemanticTokenDto> {
    const [found] = await this.db
      .select()
      .from(semanticToken)
      .where(
        and(
          eq(semanticToken.id, id),
          eq(semanticToken.workspaceId, workspaceId),
        ),
      );

    if (!found) {
      throw new NotFoundException('Semantic token not found');
    }

    return found;
  }

  async update(
    id: string,
    workspaceId: string,
    updateSemanticTokenDto: UpdateSemanticTokenDto,
  ): Promise<SemanticTokenDto> {
    await this.ensureExists(id, workspaceId);

    const values: Partial<
      Pick<SemanticTokenDto, 'name' | 'type' | 'description'>
    > = {};

    if (updateSemanticTokenDto.name !== undefined) {
      values.name = this.normalizeRequiredField(
        updateSemanticTokenDto.name,
        'Semantic token name is required',
      );
    }

    if (updateSemanticTokenDto.type !== undefined) {
      values.type = this.normalizeRequiredField(
        updateSemanticTokenDto.type,
        'Semantic token type is required',
      );
    }

    if (updateSemanticTokenDto.description !== undefined) {
      values.description = this.normalizeOptionalField(
        updateSemanticTokenDto.description,
      );
    }

    if (Object.keys(values).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const [updated] = await this.db
      .update(semanticToken)
      .set(values)
      .where(
        and(
          eq(semanticToken.id, id),
          eq(semanticToken.workspaceId, workspaceId),
        ),
      )
      .returning();

    return updated;
  }

  async remove(id: string, workspaceId: string): Promise<{ deleted: true }> {
    await this.ensureExists(id, workspaceId);
    await this.db
      .delete(semanticToken)
      .where(
        and(
          eq(semanticToken.id, id),
          eq(semanticToken.workspaceId, workspaceId),
        ),
      );

    return { deleted: true };
  }

  private async ensureExists(id: string, workspaceId: string): Promise<void> {
    const [found] = await this.db
      .select({ id: semanticToken.id })
      .from(semanticToken)
      .where(
        and(
          eq(semanticToken.id, id),
          eq(semanticToken.workspaceId, workspaceId),
        ),
      );

    if (!found) {
      throw new NotFoundException('Semantic token not found');
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
