import { DrizzlePGModule } from '@knaadh/nestjs-drizzle-pg';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from '@thallesp/nestjs-better-auth';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createAuth } from './auth/auth.config';
import { ComponentTokenModule } from './component-token/component-token.module';
import { env } from './config/env';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { EmailService } from './email/email.service';
import { PrimitiveTokenModule } from './primitive-token/primitive-token.module';
import * as schema from './schema';
import { SemanticTokenModule } from './semantic-token/semantic-token.module';
import { UserModule } from './user/user.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { WorkspaceService } from './workspace/workspace.service';

@Module({
  imports: [
    AuthModule.forRootAsync({
      inject: [EmailService, WorkspaceService],
      useFactory: (
        emailService: EmailService,
        workspaceService: WorkspaceService,
      ) => ({
        auth: createAuth(emailService, workspaceService),
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
          connectionString: env.DATABASE_URL,
        },
      },
      config: { schema },
    }),
    DatabaseModule,
    TerminusModule,
    EmailModule,
    UserModule,
    WorkspaceModule,
    PrimitiveTokenModule,
    SemanticTokenModule,
    ComponentTokenModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
