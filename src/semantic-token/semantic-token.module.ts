import { Module } from '@nestjs/common';

import { WorkspaceGuard } from '../common/guards/workspace.guard';
import { WorkspaceModule } from '../workspace/workspace.module';

import { SemanticTokenController } from './semantic-token.controller';
import { SemanticTokenService } from './semantic-token.service';

@Module({
  imports: [WorkspaceModule],
  controllers: [SemanticTokenController],
  providers: [SemanticTokenService, WorkspaceGuard],
})
export class SemanticTokenModule {}
