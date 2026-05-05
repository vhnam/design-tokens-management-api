import { Module } from '@nestjs/common';

import { OrganizationGuard } from '../common/guards/organization.guard';

import { TokenSetController } from './token-set.controller';
import { TokenSetService } from './token-set.service';

@Module({
  controllers: [TokenSetController],
  providers: [TokenSetService, OrganizationGuard],
})
export class TokenSetModule {}
