import { Inject, Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import * as schema from './schema/auth.schema';

@Injectable()
export class AppService {
  constructor(
    @Inject('DB_DEV')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly health: HealthCheckService,
    private readonly healthIndicator: HealthIndicatorService,
  ) {}

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicator.check('database');

    try {
      await this.db.execute(sql`select 1`);
      return indicator.up();
    } catch (error) {
      return indicator.down(
        error instanceof Error ? error.message : 'Unknown database error',
      );
    }
  }

  checkHealth() {
    return this.health.check([() => this.checkDatabase()]);
  }
}
