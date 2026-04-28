import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AuthGuard,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

import { db } from '../config/db';
import { workspace } from '../schema/workspace';

import type {
  CreatePrimitiveTokenDto,
  UpdatePrimitiveTokenDto,
} from './primitive-token.dto';
import { PrimitiveTokenService } from './primitive-token.service';

@Controller('primitive-tokens')
@UseGuards(AuthGuard)
export class PrimitiveTokenController {
  constructor(private readonly primitiveTokenService: PrimitiveTokenService) {}

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() createPrimitiveTokenDto: CreatePrimitiveTokenDto,
  ) {
    const workspaceId = await this.getWorkspaceId(session);

    return this.primitiveTokenService.create({
      ...createPrimitiveTokenDto,
      workspaceId,
    });
  }

  @Get()
  async findAll(@Session() session: UserSession) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.primitiveTokenService.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.primitiveTokenService.findOne(id, workspaceId);
  }

  @Patch(':id')
  async update(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePrimitiveTokenDto: UpdatePrimitiveTokenDto,
  ) {
    const workspaceId = await this.getWorkspaceId(session);

    return this.primitiveTokenService.update(
      id,
      workspaceId,
      updatePrimitiveTokenDto,
    );
  }

  @Delete(':id')
  async remove(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.primitiveTokenService.remove(id, workspaceId);
  }

  private async getWorkspaceId(session: UserSession): Promise<string> {
    const fromUser = (session.user as { workspaceId?: string }).workspaceId;
    const fromSession = (session as { session?: { workspaceId?: string } })
      .session?.workspaceId;
    const normalized = (fromUser ?? fromSession)?.trim();

    if (normalized) {
      return normalized;
    }

    const [fallbackWorkspace] = await db
      .select({ id: workspace.id })
      .from(workspace)
      .limit(1);

    if (!fallbackWorkspace) {
      throw new BadRequestException('Workspace id is required in session');
    }

    return fallbackWorkspace.id;
  }
}
