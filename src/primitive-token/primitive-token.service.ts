import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import {
  DEFAULT_TOKEN_SET_NAME,
  ensureTokenHierarchyBootstrap,
} from '../common/bootstrap/token-hierarchy.bootstrap';
import type { Database } from '../config/db.config';
import { DATABASE } from '../database/database.constants';
import { TokenLevel, TokenType } from '../enums/token.enum';
import { organizations } from '../schema/auth.schema';
import {
  tokenFiles,
  tokenGroups,
  tokenSets,
  tokens,
} from '../schema/tokens.schema';

import type {
  CreatePrimitiveTokenDto,
  PrimitiveTokenDto,
  UpdatePrimitiveTokenDto,
} from './primitive-token.dto';

const PRIMITIVE_FILE_NAME = '__primitive_tokens__';
const PRIMITIVE_GROUP_NAME = '__primitive_group__';

type CreatePrimitiveTokenInput = CreatePrimitiveTokenDto & {
  organizationId: string;
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
    const type = this.normalizeTokenType(
      createPrimitiveTokenDto.type,
      'Primitive token type is required',
    );
    const value = this.normalizeRequiredField(
      createPrimitiveTokenDto.rawValue,
      'Primitive token value is required',
    );
    const description = this.normalizeOptionalField(
      createPrimitiveTokenDto.description,
    );
    const organizationId = this.normalizeRequiredField(
      createPrimitiveTokenDto.organizationId,
      'Primitive token organization is required',
    );

    const { ownerId } = await this.ensureOrganization(organizationId);

    let groupId = await this.resolvePrimitiveGroupId(organizationId);

    if (!groupId) {
      await ensureTokenHierarchyBootstrap(this.db, {
        ownerId: ownerId ?? '',
        organizationId,
        fileName: PRIMITIVE_FILE_NAME,
        groupName: PRIMITIVE_GROUP_NAME,
        level: TokenLevel.Primitive,
        lockKind: 'primitive',
      });
      groupId = await this.resolvePrimitiveGroupId(organizationId);

      if (!groupId) {
        throw new BadRequestException('Failed to bootstrap primitive tokens');
      }
    }

    const [createdRow] = await this.db
      .insert(tokens)
      .values({
        id: randomUUID(),
        groupId,
        name,
        type,
        rawValue: value,
        isAlias: false,
        isComposite: false,
        description,
      })
      .returning({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        rawValue: tokens.rawValue,
        description: tokens.description,
      });

    return this.rowToDto(createdRow, organizationId);
  }

  async findAll(organizationId: string): Promise<PrimitiveTokenDto[]> {
    await this.ensureOrganization(organizationId);

    const rows = await this.db
      .select({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        rawValue: tokens.rawValue,
        description: tokens.description,
        organizationId: tokenFiles.organizationId,
      })
      .from(tokens)
      .innerJoin(tokenGroups, eq(tokens.groupId, tokenGroups.id))
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(primitiveHierarchyWhere(organizationId));

    return rows.map((row) =>
      this.rowToDto(
        {
          id: row.id,
          name: row.name,
          type: row.type,
          rawValue: row.rawValue,
          description: row.description,
        },
        row.organizationId,
      ),
    );
  }

  async findOne(
    id: string,
    organizationId: string,
  ): Promise<PrimitiveTokenDto> {
    const row = await this.findOwnedTokenRow(id, organizationId);

    return this.rowToDto(row, organizationId);
  }

  async update(
    id: string,
    organizationId: string,
    updatePrimitiveTokenDto: UpdatePrimitiveTokenDto,
  ): Promise<PrimitiveTokenDto> {
    await this.ensureExists(id, organizationId);

    const values: Partial<{
      name: string;
      type: TokenType;
      rawValue: string;
      description: string | null;
    }> = {};

    if (updatePrimitiveTokenDto.name !== undefined) {
      values.name = this.normalizeRequiredField(
        updatePrimitiveTokenDto.name,
        'Primitive token name is required',
      );
    }

    if (updatePrimitiveTokenDto.type !== undefined) {
      values.type = this.normalizeTokenType(
        updatePrimitiveTokenDto.type,
        'Primitive token type is required',
      );
    }

    if (updatePrimitiveTokenDto.rawValue !== undefined) {
      values.rawValue = this.normalizeRequiredField(
        updatePrimitiveTokenDto.rawValue,
        'Primitive token value is required',
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

    const [updatedRow] = await this.db
      .update(tokens)
      .set(values)
      .where(eq(tokens.id, id))
      .returning({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        rawValue: tokens.rawValue,
        description: tokens.description,
      });

    return this.rowToDto(updatedRow, organizationId);
  }

  async remove(id: string, organizationId: string): Promise<{ deleted: true }> {
    await this.ensureExists(id, organizationId);
    await this.db.delete(tokens).where(eq(tokens.id, id));

    return { deleted: true };
  }

  private async ensureOrganization(
    organizationId: string,
  ): Promise<{ ownerId: string | null }> {
    const [org] = await this.db
      .select({ ownerId: organizations.createdBy })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return { ownerId: org.ownerId ?? null };
  }

  private async resolvePrimitiveGroupId(
    organizationId: string,
  ): Promise<string | null> {
    const [row] = await this.db
      .select({ groupId: tokenGroups.id })
      .from(tokenGroups)
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(primitiveHierarchyWhere(organizationId))
      .limit(1);

    return row?.groupId ?? null;
  }

  private async ensureExists(
    id: string,
    organizationId: string,
  ): Promise<void> {
    await this.findOwnedTokenRow(id, organizationId);
  }

  private async findOwnedTokenRow(
    id: string,
    organizationId: string,
  ): Promise<{
    id: string;
    name: string;
    type: TokenType | null;
    rawValue: string | null;
    description: string | null;
  }> {
    await this.ensureOrganization(organizationId);

    const [found] = await this.db
      .select({
        id: tokens.id,
        name: tokens.name,
        type: tokens.type,
        rawValue: tokens.rawValue,
        description: tokens.description,
      })
      .from(tokens)
      .innerJoin(tokenGroups, eq(tokens.groupId, tokenGroups.id))
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(and(eq(tokens.id, id), primitiveHierarchyWhere(organizationId)));

    if (!found) {
      throw new NotFoundException('Primitive token not found');
    }

    return found;
  }

  private rowToDto(
    row: {
      id: string;
      name: string;
      type: TokenType | null;
      rawValue: string | null;
      description: string | null;
    },
    organizationId: string,
  ): PrimitiveTokenDto {
    return {
      id: row.id,
      name: row.name,
      type: row.type ?? TokenType.String,
      rawValue: row.rawValue ?? '',
      description: row.description,
      organizationId,
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
      throw new BadRequestException('Primitive token type is invalid');
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

function primitiveHierarchyWhere(organizationId: string) {
  return and(
    eq(tokenFiles.organizationId, organizationId),
    eq(tokenFiles.name, PRIMITIVE_FILE_NAME),
    eq(tokenSets.name, DEFAULT_TOKEN_SET_NAME),
    eq(tokenGroups.name, PRIMITIVE_GROUP_NAME),
    eq(tokenGroups.level, TokenLevel.Primitive),
  );
}
