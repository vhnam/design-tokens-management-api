import { varchar } from 'drizzle-orm/pg-core';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('emailVerified').notNull().default(false),
    image: text('image'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex('user_email_unique').on(table.email)],
);
export const sessions = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    activeOrganizationId: text('active_organization_id'),
    activeTeamId: text('active_team_id'),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('session_token_unique').on(table.token),
    index('session_user_id_idx').on(table.userId),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('account_provider_account_unique').on(
      table.providerId,
      table.accountId,
    ),
    index('account_user_id_idx').on(table.userId),
  ],
);
export const verifications = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt', { withTimezone: true }).notNull(),
    createdAt: timestamp('createdAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('verification_identifier_unique').on(table.identifier),
  ],
);

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  createdBy: text('created_by').references(() => users.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const members = pgTable('members', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', {
    precision: 6,
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp('expires_at', {
    precision: 6,
    withTimezone: true,
  }).notNull(),
});
