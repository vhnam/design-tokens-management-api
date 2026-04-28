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
import {
  AuthGuard,
  // Session is resolved by AuthGuard and workspace by WorkspaceGuard
} from '@thallesp/nestjs-better-auth';

import { WorkspaceId } from '../common/decorators/workspace-id.decorator';
import { WorkspaceGuard } from '../common/guards/workspace.guard';

import type {
  CreatePrimitiveTokenDto,
  UpdatePrimitiveTokenDto,
} from './primitive-token.dto';
import { PrimitiveTokenService } from './primitive-token.service';

@Controller('primitive-tokens')
@UseGuards(AuthGuard, WorkspaceGuard)
export class PrimitiveTokenController {
  constructor(private readonly primitiveTokenService: PrimitiveTokenService) {}

  @Post()
  create(
    @WorkspaceId() workspaceId: string,
    @Body() createPrimitiveTokenDto: CreatePrimitiveTokenDto,
  ) {
    return this.primitiveTokenService.create({
      ...createPrimitiveTokenDto,
      workspaceId,
    });
  }

  @Get()
  findAll(@WorkspaceId() workspaceId: string) {
    return this.primitiveTokenService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.primitiveTokenService.findOne(id, workspaceId);
  }

  @Patch(':id')
  update(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePrimitiveTokenDto: UpdatePrimitiveTokenDto,
  ) {
    return this.primitiveTokenService.update(
      id,
      workspaceId,
      updatePrimitiveTokenDto,
    );
  }

  @Delete(':id')
  remove(
    @WorkspaceId() workspaceId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.primitiveTokenService.remove(id, workspaceId);
  }
}
