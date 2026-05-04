import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule as NestjsBetterAuthModule } from '@thallesp/nestjs-better-auth';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { getDatabaseUrlFromEnv } from './config/db.config';
import { env } from './config/env.config';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { PrimitiveTokenModule } from './primitive-token/primitive-token.module';
import { ProjectModule } from './project/project.module';
import * as schema from './schema';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    NestjsBetterAuthModule.forRootAsync({
      imports: [AuthModule],
      inject: [AuthService],
      useFactory: (authService: AuthService) => ({
        auth: authService.createAuth(),
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
          rawBody: true,
        },
      }),
    }),
    DrizzlePGModule.register({
      tag: 'DB_DEV',
      pg: {
        connection: 'pool',
        config: {
          connectionString: getDatabaseUrlFromEnv(env),
        },
      },
      config: { schema },
    }),
    DatabaseModule,
    TerminusModule,
    AuthModule,
    EmailModule,
    UserModule,
    ProjectModule,
    PrimitiveTokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
