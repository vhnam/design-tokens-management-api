import { Module } from '@nestjs/common';

import { OrganizationGuard } from '../common/guards/organization.guard';

import { PrimitiveTokenController } from './primitive-token.controller';
import { PrimitiveTokenService } from './primitive-token.service';

@Module({
  controllers: [PrimitiveTokenController],
  providers: [PrimitiveTokenService, OrganizationGuard],
})
export class PrimitiveTokenModule {}
