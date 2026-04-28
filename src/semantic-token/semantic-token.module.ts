import { Module } from '@nestjs/common';

import { SemanticTokenController } from './semantic-token.controller';
import { SemanticTokenService } from './semantic-token.service';

@Module({
  controllers: [SemanticTokenController],
  providers: [SemanticTokenService],
})
export class SemanticTokenModule {}
