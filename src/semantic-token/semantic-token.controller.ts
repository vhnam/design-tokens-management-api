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
  CreateSemanticTokenDto,
  UpdateSemanticTokenDto,
} from './semantic-token.dto';
import { SemanticTokenService } from './semantic-token.service';

@Controller('semantic-tokens')
@UseGuards(AuthGuard, WorkspaceGuard)
export class SemanticTokenController {
  constructor(private readonly semanticTokenService: SemanticTokenService) {}

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body() createSemanticTokenDto: CreateSemanticTokenDto,
  ) {
    return this.semanticTokenService.create({
      ...createSemanticTokenDto,
      workspaceId,
    });
  }

  @Get()
  findAll(@WorkspaceId() workspaceId: string) {
    return this.semanticTokenService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.semanticTokenService.findOne(id, workspaceId);
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateSemanticTokenDto: UpdateSemanticTokenDto,
  ) {
    return this.semanticTokenService.update(
      id,
      workspaceId,
      updateSemanticTokenDto,
    );
  }

  @Delete(':id')
  remove(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.semanticTokenService.remove(id, workspaceId);
  }
}
