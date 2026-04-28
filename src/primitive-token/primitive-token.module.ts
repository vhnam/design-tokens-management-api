import { Module } from '@nestjs/common';

import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { WorkspaceModule } from '../workspace/workspace.module';

import { PrimitiveTokenController } from './primitive-token.controller';
import { PrimitiveTokenService } from './primitive-token.service';

@Module({
  imports: [WorkspaceModule],
  controllers: [PrimitiveTokenController],
  providers: [PrimitiveTokenService, WorkspaceGuard],
})
export class PrimitiveTokenModule {}
