import { Module } from '@nestjs/common';

import { OrganizationGuard } from '../common/guards/organization.guard';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, OrganizationGuard],
})
export class ProjectModule {}
