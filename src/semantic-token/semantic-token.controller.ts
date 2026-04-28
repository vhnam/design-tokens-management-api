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
  CreateSemanticTokenDto,
  UpdateSemanticTokenDto,
} from './semantic-token.dto';
import { SemanticTokenService } from './semantic-token.service';

@Controller('semantic-tokens')
@UseGuards(AuthGuard)
export class SemanticTokenController {
  constructor(private readonly semanticTokenService: SemanticTokenService) {}

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() createSemanticTokenDto: CreateSemanticTokenDto,
  ) {
    const workspaceId = await this.getWorkspaceId(session);

    return this.semanticTokenService.create({
      ...createSemanticTokenDto,
      workspaceId,
    });
  }

  @Get()
  async findAll(@Session() session: UserSession) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.semanticTokenService.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.semanticTokenService.findOne(id, workspaceId);
  }

  @Patch(':id')
  async update(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSemanticTokenDto: UpdateSemanticTokenDto,
  ) {
    const workspaceId = await this.getWorkspaceId(session);

    return this.semanticTokenService.update(
      id,
      workspaceId,
      updateSemanticTokenDto,
    );
  }

  @Delete(':id')
  async remove(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.semanticTokenService.remove(id, workspaceId);
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
