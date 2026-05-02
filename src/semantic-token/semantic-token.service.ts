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
import { TokenLevel, TokenType } from '../enums/token.enum';
import {
  tokenFiles,
  tokenGroups,
  tokenSets,
  tokens,
} from '../schema/tokens.schema';
import { workspaces } from '../schema/workspaces.schema';
import {
  DEFAULT_TOKEN_SET_NAME,
  ensureTokenHierarchyBootstrap,
} from '../common/bootstrap/token-hierarchy.bootstrap';

import type {
  CreateSemanticTokenDto,
  SemanticTokenDto,
  UpdateSemanticTokenDto,
} from './semantic-token.dto';

const SEMANTIC_FILE_NAME = '__semantic_tokens__';
const SEMANTIC_GROUP_NAME = '__semantic_group__';

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
    const type = this.normalizeTokenType(
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

    const { ownerId } = await this.ensureWorkspace(workspaceId);

    let groupId = await this.resolveSemanticGroupId(workspaceId);

    if (!groupId) {
      await ensureTokenHierarchyBootstrap(this.db, {
        ownerId,
        workspaceId,
        fileName: SEMANTIC_FILE_NAME,
        groupName: SEMANTIC_GROUP_NAME,
        level: TokenLevel.Semantic,
        lockKind: 'semantic',
      });
      groupId = await this.resolveSemanticGroupId(workspaceId);

      if (!groupId) {
        throw new BadRequestException('Failed to bootstrap semantic tokens');
      }
    }

    const [createdRow] = await this.db
      .insert(tokens)
      .values({
        id: randomUUID(),
        groupId,
        name,
        type,
        rawValue: null,
        isAlias: false,
        isComposite: false,
        description,
      })
      .returning({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        description: tokens.description,
      });

    return this.rowToDto(createdRow, workspaceId);
  }

  async findAll(workspaceId: string): Promise<SemanticTokenDto[]> {
    await this.ensureWorkspace(workspaceId);

    const rows = await this.db
      .select({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        description: tokens.description,
        workspaceId: tokenFiles.workspaceId,
      })
      .from(tokens)
      .innerJoin(tokenGroups, eq(tokens.groupId, tokenGroups.id))
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(semanticHierarchyWhere(workspaceId));

    return rows.map((row) =>
      this.rowToDto(
        {
          id: row.id,
          name: row.name,
          type: row.type,
          description: row.description,
        },
        row.workspaceId,
      ),
    );
  }

  async findOne(id: string, workspaceId: string): Promise<SemanticTokenDto> {
    const row = await this.findOwnedTokenRow(id, workspaceId);

    return this.rowToDto(row, workspaceId);
  }

  async update(
    id: string,
    workspaceId: string,
    updateSemanticTokenDto: UpdateSemanticTokenDto,
  ): Promise<SemanticTokenDto> {
    await this.ensureExists(id, workspaceId);

    const values: Partial<{
      name: string;
      type: TokenType;
      description: string | null;
    }> = {};

    if (updateSemanticTokenDto.name !== undefined) {
      values.name = this.normalizeRequiredField(
        updateSemanticTokenDto.name,
        'Semantic token name is required',
      );
    }

    if (updateSemanticTokenDto.type !== undefined) {
      values.type = this.normalizeTokenType(
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

    const [updatedRow] = await this.db
      .update(tokens)
      .set(values)
      .where(eq(tokens.id, id))
      .returning({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        description: tokens.description,
      });

    return this.rowToDto(updatedRow, workspaceId);
  }

  async remove(id: string, workspaceId: string): Promise<{ deleted: true }> {
    await this.ensureExists(id, workspaceId);
    await this.db.delete(tokens).where(eq(tokens.id, id));

    return { deleted: true };
  }

  private async ensureWorkspace(
    workspaceId: string,
  ): Promise<{ ownerId: string }> {
    const [ws] = await this.db
      .select({ ownerId: workspaces.ownerId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!ws) {
      throw new NotFoundException('Workspace not found');
    }

    return ws;
  }

  private async resolveSemanticGroupId(
    workspaceId: string,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ groupId: tokenGroups.id })
      .from(tokenGroups)
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(semanticHierarchyWhere(workspaceId))
      .limit(1);

    return row?.groupId ?? null;
  }

  private async ensureExists(id: string, workspaceId: string): Promise<void> {
    await this.findOwnedTokenRow(id, workspaceId);
  }

  private async findOwnedTokenRow(
    id: string,
    workspaceId: string,
  ): Promise<{
    id: string;
    name: string;
    type: TokenType | null;
    description: string | null;
  }> {
    await this.ensureWorkspace(workspaceId);

    const [found] = await this.db
      .select({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        description: tokens.description,
      })
      .from(tokens)
      .innerJoin(tokenGroups, eq(tokens.groupId, tokenGroups.id))
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(and(eq(tokens.id, id), semanticHierarchyWhere(workspaceId)));

    if (!found) {
      throw new NotFoundException('Semantic token not found');
    }

    return found;
  }

  private rowToDto(
    row: {
      id: string;
      name: string;
      type: TokenType | null;
      description: string | null;
    },
    workspaceId: string,
  ): SemanticTokenDto {
    return {
      id: row.id,
      name: row.name,
      type: row.type ?? '',
      description: row.description,
      workspaceId,
    };
  }

  private normalizeRequiredField(value: string, message: string): string {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private normalizeTokenType(value: string, message: string): TokenType {
    const normalized = this.normalizeRequiredField(value, message);

    if (!Object.values(TokenType).includes(normalized as TokenType)) {
      throw new BadRequestException('Semantic token type is invalid');
    }

    return normalized as TokenType;
  }

  private normalizeOptionalField(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length ? normalized : null;
  }
}

function semanticHierarchyWhere(workspaceId: string) {
  return and(
    eq(tokenFiles.workspaceId, workspaceId),
    eq(tokenFiles.name, SEMANTIC_FILE_NAME),
    eq(tokenSets.name, DEFAULT_TOKEN_SET_NAME),
    eq(tokenGroups.name, SEMANTIC_GROUP_NAME),
    eq(tokenGroups.level, TokenLevel.Semantic),
  );
}
