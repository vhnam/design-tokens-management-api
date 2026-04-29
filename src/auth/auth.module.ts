import { Module } from '@nestjs/common';

import { EmailModule } from '../email/email.module';

import { AuthService } from './auth.service';

@Module({
  imports: [EmailModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
