import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { workspace } from './workspace';

export const componentToken = pgTable('component_token', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  description: text('description'),
  workspaceId: text('workspaceId')
    .notNull()
    .references(() => workspace.id, { onDelete: 'cascade' }),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
