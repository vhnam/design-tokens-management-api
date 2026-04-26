import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from '@thallesp/nestjs-better-auth';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './auth/auth.config';
import { env } from './config/env';
import { EmailModule } from './email/email.module';
import * as schema from './schema/auth';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
    DrizzlePGModule.register({
      tag: 'DB_DEV',
      pg: {
        connection: 'pool',
        config: {
          connectionString: env.DATABASE_URL,
        },
      },
      config: { schema },
    }),
    TerminusModule,
    EmailModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
