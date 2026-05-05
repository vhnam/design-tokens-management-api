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

import { OrganizationId } from '../common/decorators/organization-id.decorator';
import { OrganizationGuard } from '../common/guards/organization.guard';

import type { CreateTokenSetDto, UpdateTokenSetDto } from './token-set.dto';
import { TokenSetService } from './token-set.service';

@Controller('projects/:projectId/token-sets')
@UseGuards(AuthGuard, OrganizationGuard)
export class TokenSetController {
  constructor(private readonly tokenSetService: TokenSetService) {}

  @Post()
  create(
    @OrganizationId() organizationId: string,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Body() createTokenSetDto: CreateTokenSetDto,
  ) {
    return this.tokenSetService.create(
      projectId,
      organizationId,
      createTokenSetDto,
    );
  }

  @Get()
  findAll(
    @OrganizationId() organizationId: string,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
  ) {
    return this.tokenSetService.findAll(projectId, organizationId);
  }

  @Get(':id')
  findOne(
    @OrganizationId() organizationId: string,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.tokenSetService.findOne(projectId, id, organizationId);
  }

  @Patch(':id')
  update(
    @OrganizationId() organizationId: string,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTokenSetDto: UpdateTokenSetDto,
  ) {
    return this.tokenSetService.update(
      projectId,
      id,
      organizationId,
      updateTokenSetDto,
    );
  }

  @Delete(':id')
  remove(
    @OrganizationId() organizationId: string,
    @Param('projectId', new ParseUUIDPipe()) projectId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.tokenSetService.remove(projectId, id, organizationId);
  }
}
