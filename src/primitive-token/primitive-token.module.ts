import { Module } from '@nestjs/common';

import { PrimitiveTokenController } from './primitive-token.controller';
import { PrimitiveTokenService } from './primitive-token.service';

@Module({
  controllers: [PrimitiveTokenController],
  providers: [PrimitiveTokenService],
})
export class PrimitiveTokenModule {}
