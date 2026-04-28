import { Global, Module } from '@nestjs/common';

import { db } from '../config/db';

import { DATABASE } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE,
      useValue: db,
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
