import { Module } from '@nestjs/common';

import { ComponentTokenController } from './component-token.controller';
import { ComponentTokenService } from './component-token.service';

@Module({
  controllers: [ComponentTokenController],
  providers: [ComponentTokenService],
})
export class ComponentTokenModule {}
