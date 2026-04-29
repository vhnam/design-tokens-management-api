import { pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

import { user } from './auth';
import { workspace } from './workspace';

export const workspaceUser = pgTable(
  'workspace_user',
  {
    workspaceId: text('workspaceId')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [
    // Composite primary key ensures each (workspaceId, userId) pair is unique.
    primaryKey({
      name: 'workspace_user_pk',
      columns: [table.workspaceId, table.userId],
    }),
  ],
);
