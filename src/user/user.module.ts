import { Module } from '@nestjs/common';

import { MediaModule } from '../media/media.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [MediaModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
