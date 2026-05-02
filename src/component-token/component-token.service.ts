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
  ComponentTokenDto,
  CreateComponentTokenDto,
  UpdateComponentTokenDto,
} from './component-token.dto';

const COMPONENT_FILE_NAME = '__component_tokens__';
const COMPONENT_GROUP_NAME = '__component_group__';

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
    const type = this.normalizeTokenType(
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

    const { ownerId } = await this.ensureWorkspace(workspaceId);

    let groupId = await this.resolveComponentGroupId(workspaceId);

    if (!groupId) {
      await ensureTokenHierarchyBootstrap(this.db, {
        ownerId,
        workspaceId,
        fileName: COMPONENT_FILE_NAME,
        groupName: COMPONENT_GROUP_NAME,
        level: TokenLevel.Component,
        lockKind: 'component',
      });
      groupId = await this.resolveComponentGroupId(workspaceId);

      if (!groupId) {
        throw new BadRequestException('Failed to bootstrap component tokens');
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

  async findAll(workspaceId: string): Promise<ComponentTokenDto[]> {
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
      .where(componentHierarchyWhere(workspaceId));

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

  async findOne(id: string, workspaceId: string): Promise<ComponentTokenDto> {
    const row = await this.findOwnedTokenRow(id, workspaceId);

    return this.rowToDto(row, workspaceId);
  }

  async update(
    id: string,
    workspaceId: string,
    updateComponentTokenDto: UpdateComponentTokenDto,
  ): Promise<ComponentTokenDto> {
    await this.ensureExists(id, workspaceId);

    const values: Partial<{
      name: string;
      type: TokenType;
      description: string | null;
    }> = {};

    if (updateComponentTokenDto.name !== undefined) {
      values.name = this.normalizeRequiredField(
        updateComponentTokenDto.name,
        'Component token name is required',
      );
    }

    if (updateComponentTokenDto.type !== undefined) {
      values.type = this.normalizeTokenType(
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

  private async resolveComponentGroupId(
    workspaceId: string,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ groupId: tokenGroups.id })
      .from(tokenGroups)
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(componentHierarchyWhere(workspaceId))
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
      .where(and(eq(tokens.id, id), componentHierarchyWhere(workspaceId)));

    if (!found) {
      throw new NotFoundException('Component token not found');
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
  ): ComponentTokenDto {
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
      throw new BadRequestException('Component token type is invalid');
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

function componentHierarchyWhere(workspaceId: string) {
  return and(
    eq(tokenFiles.workspaceId, workspaceId),
    eq(tokenFiles.name, COMPONENT_FILE_NAME),
    eq(tokenSets.name, DEFAULT_TOKEN_SET_NAME),
    eq(tokenGroups.name, COMPONENT_GROUP_NAME),
    eq(tokenGroups.level, TokenLevel.Component),
  );
}
