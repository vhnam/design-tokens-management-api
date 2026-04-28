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
  CreateComponentTokenDto,
  UpdateComponentTokenDto,
} from './component-token.dto';
import { ComponentTokenService } from './component-token.service';

@Controller('component-tokens')
@UseGuards(AuthGuard)
export class ComponentTokenController {
  constructor(private readonly componentTokenService: ComponentTokenService) {}

  @Post()
  async create(
    @Session() session: UserSession,
    @Body() createComponentTokenDto: CreateComponentTokenDto,
  ) {
    const workspaceId = await this.getWorkspaceId(session);

    return this.componentTokenService.create({
      ...createComponentTokenDto,
      workspaceId,
    });
  }

  @Get()
  async findAll(@Session() session: UserSession) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.componentTokenService.findAll(workspaceId);
  }

  @Get(':id')
  async findOne(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.componentTokenService.findOne(id, workspaceId);
  }

  @Patch(':id')
  async update(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateComponentTokenDto: UpdateComponentTokenDto,
  ) {
    const workspaceId = await this.getWorkspaceId(session);

    return this.componentTokenService.update(
      id,
      workspaceId,
      updateComponentTokenDto,
    );
  }

  @Delete(':id')
  async remove(
    @Session() session: UserSession,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const workspaceId = await this.getWorkspaceId(session);
    return this.componentTokenService.remove(id, workspaceId);
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
