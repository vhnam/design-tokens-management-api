import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const workspace = pgTable('workspace', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
