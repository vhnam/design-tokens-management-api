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
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import { OrganizationId } from '../common/decorators/organization-id.decorator';
import { OrganizationGuard } from '../common/guards/organization.guard';

import type { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { ProjectService } from './project.service';

@Controller('projects')
@UseGuards(AuthGuard, OrganizationGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(
    @Session() session: UserSession,
    @OrganizationId() organizationId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectService.create(
      createProjectDto,
      organizationId,
      session.user.id,
    );
  }

  @Get()
  findAll(@OrganizationId() organizationId: string) {
    return this.projectService.findAll(organizationId);
  }

  @Get(':id')
  findOne(
    @OrganizationId() organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.projectService.findOne(id, organizationId);
  }

  @Patch(':id')
  update(
    @OrganizationId() organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, organizationId, updateProjectDto);
  }

  @Delete(':id')
  remove(
    @OrganizationId() organizationId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.projectService.remove(id, organizationId);
  }
}
