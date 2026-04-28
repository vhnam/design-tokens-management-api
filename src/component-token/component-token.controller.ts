import {
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
import { AuthGuard } from '@thallesp/nestjs-better-auth';

import { WorkspaceId } from '../common/decorators/workspace-id.decorator';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

import type {
  CreateComponentTokenDto,
  UpdateComponentTokenDto,
} from './component-token.dto';
import { ComponentTokenService } from './component-token.service';

@Controller('component-tokens')
@UseGuards(AuthGuard, WorkspaceGuard)
export class ComponentTokenController {
  constructor(private readonly componentTokenService: ComponentTokenService) {}

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body() createComponentTokenDto: CreateComponentTokenDto,
  ) {
    return this.componentTokenService.create({
      ...createComponentTokenDto,
      workspaceId,
    });
  }

  @Get()
  findAll(@WorkspaceId() workspaceId: string) {
    return this.componentTokenService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.componentTokenService.findOne(id, workspaceId);
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateComponentTokenDto: UpdateComponentTokenDto,
  ) {
    return this.componentTokenService.update(
      id,
      workspaceId,
      updateComponentTokenDto,
    );
  }

  @Delete(':id')
  remove(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.componentTokenService.remove(id, workspaceId);
  }
}
