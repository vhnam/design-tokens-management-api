import { Module } from '@nestjs/common';

import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { WorkspaceModule } from '../workspace/workspace.module';

import { ComponentTokenController } from './component-token.controller';
import { ComponentTokenService } from './component-token.service';

@Module({
  imports: [WorkspaceModule],
  controllers: [ComponentTokenController],
  providers: [ComponentTokenService, WorkspaceGuard],
})
export class ComponentTokenModule {}
