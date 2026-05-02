import { relations } from 'drizzle-orm';
import { integer, pgEnum, text, timestamp } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { boolean } from 'drizzle-orm/pg-core';

import { TokenLevel, TokenType } from '../enums/token.enum';

import { users } from './auth.schema';
import { workspaces } from './workspaces.schema';

export const tokenLevelEnum = pgEnum('token_level', [
  'primitive',
  'semantic',
  'component',
]);

export const tokenTypeEnum = pgEnum('token_type', [
  'color',
  'dimension',
  'typography',
  'shadow',
  'gradient',
  'border',
  'transition',
  'fontFamily',
  'fontWeight',
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'duration',
  'cubicBezier',
  'number',
  'string',
]);

export const tokenFiles = pgTable(
  'token_files',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    ownerId: text('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('token_files_workspace_id_name_uidx').on(t.workspaceId, t.name),
  ],
);

export const tokenSets = pgTable(
  'token_sets',
  {
    id: text('id').primaryKey(),
    fileId: text('file_id')
      .notNull()
      .references(() => tokenFiles.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // "light", "dark", "brand-acme"
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('token_sets_file_id_idx').on(t.fileId),
    uniqueIndex('token_sets_file_id_name_uidx').on(t.fileId, t.name),
  ],
);

export const tokenGroups = pgTable(
  'token_groups',
  {
    id: text('id').primaryKey(),
    setId: text('set_id')
      .notNull()
      .references(() => tokenSets.id, { onDelete: 'cascade' }),
    parentGroupId: text('parent_group_id'),
    name: text('name').notNull(),
    level: tokenLevelEnum('level').$type<TokenLevel>().notNull(),
    componentName: text('component_name'),
    inheritedType: tokenTypeEnum('inherited_type').$type<TokenType>().notNull(),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('token_groups_set_id_idx').on(t.setId),
    index('token_groups_parent_id_idx').on(t.parentGroupId),
  ],
);

export const tokens = pgTable(
  'tokens',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .notNull()
      .references(() => tokenGroups.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // dot-path name
    type: tokenTypeEnum('type').$type<TokenType>(),
    rawValue: text('raw_value'),
    isAlias: boolean('is_alias').notNull().default(false),
    isComposite: boolean('is_composite').notNull().default(false),
    description: text('description'),
    extensions: text('extensions'), // JSONB-like: stored as JSON string, $extensions metadata only
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('tokens_group_id_idx').on(t.groupId),
    uniqueIndex('tokens_name_group_id_idx').on(t.name, t.groupId),
    index('tokens_is_alias_idx').on(t.isAlias),
  ],
);

export const tokenCompositeProperties = pgTable(
  'token_composite_properties',
  {
    id: text('id').primaryKey(),
    tokenId: text('token_id')
      .notNull()
      .references(() => tokens.id, { onDelete: 'cascade' }),
    property: text('property').notNull(), // "fontFamily", "offsetX", "color"
    rawValue: text('raw_value').notNull(), // "{font.family.sans}" or "700"
    isAlias: boolean('is_alias').notNull().default(false),
    order: integer('order'), // using for shadow, border, gradient, typography, etc.
  },
  (t) => [index('composite_props_token_id_idx').on(t.tokenId)],
);

export const tokenAliasRefs = pgTable(
  'token_alias_refs',
  {
    id: text('id').primaryKey(),
    fromTokenId: text('from_token_id')
      .notNull()
      .references(() => tokens.id, { onDelete: 'cascade' }),
    toTokenId: text('to_token_id')
      .notNull()
      .references(() => tokens.id, { onDelete: 'cascade' }),
    fromCompositePropertyId: text('from_composite_property_id').references(
      () => tokenCompositeProperties.id,
      { onDelete: 'cascade' },
    ),
  },
  (t) => [
    index('alias_refs_from_idx').on(t.fromTokenId),
    index('alias_refs_to_idx').on(t.toTokenId),
  ],
);

export const tokenVersions = pgTable(
  'token_versions',
  {
    id: text('id').primaryKey(),
    tokenId: text('token_id')
      .notNull()
      .references(() => tokens.id, { onDelete: 'cascade' }),
    changedByUserId: text('changed_by_user_id')
      .notNull()
      .references(() => users.id),
    previousRawValue: text('previous_raw_value'),
    newRawValue: text('new_raw_value'),
    compositePropertyId: text('composite_property_id').references(
      () => tokenCompositeProperties.id,
    ),
    previousCompositeValue: text('previous_composite_value'),
    newCompositeValue: text('new_composite_value'),
    changedAt: timestamp('changed_at').notNull().defaultNow(),
  },
  (t) => [
    index('token_versions_token_id_idx').on(t.tokenId),
    index('token_versions_changed_at_idx').on(t.changedAt),
  ],
);

// Relations
export const userRelations = relations(users, ({ many }) => ({
  tokenFiles: many(tokenFiles),
  tokenVersions: many(tokenVersions),
}));

export const tokenFileRelations = relations(tokenFiles, ({ one, many }) => ({
  owner: one(users, { fields: [tokenFiles.ownerId], references: [users.id] }),
  tokenSets: many(tokenSets),
}));

export const tokenSetRelations = relations(tokenSets, ({ one, many }) => ({
  file: one(tokenFiles, {
    fields: [tokenSets.fileId],
    references: [tokenFiles.id],
  }),
  tokenGroups: many(tokenGroups),
}));

export const tokenGroupRelations = relations(tokenGroups, ({ one, many }) => ({
  set: one(tokenSets, {
    fields: [tokenGroups.setId],
    references: [tokenSets.id],
  }),
  parent: one(tokenGroups, {
    fields: [tokenGroups.parentGroupId],
    references: [tokenGroups.id],
  }),
  children: many(tokenGroups),
  tokens: many(tokens),
}));

export const tokenRelations = relations(tokens, ({ one, many }) => ({
  group: one(tokenGroups, {
    fields: [tokens.groupId],
    references: [tokenGroups.id],
  }),
  compositeProperties: many(tokenCompositeProperties),
  aliasFrom: many(tokenAliasRefs, { relationName: 'aliasFrom' }),
  aliasTo: many(tokenAliasRefs, { relationName: 'aliasTo' }),
  versions: many(tokenVersions),
}));

export const tokenCompositePropertyRelations = relations(
  tokenCompositeProperties,
  ({ one }) => ({
    token: one(tokens, {
      fields: [tokenCompositeProperties.tokenId],
      references: [tokens.id],
    }),
  }),
);

export const tokenAliasRefRelations = relations(tokenAliasRefs, ({ one }) => ({
  fromToken: one(tokens, {
    fields: [tokenAliasRefs.fromTokenId],
    references: [tokens.id],
    relationName: 'aliasFrom',
  }),
  toToken: one(tokens, {
    fields: [tokenAliasRefs.toTokenId],
    references: [tokens.id],
    relationName: 'aliasTo',
  }),
  fromCompositeProperty: one(tokenCompositeProperties, {
    fields: [tokenAliasRefs.fromCompositePropertyId],
    references: [tokenCompositeProperties.id],
  }),
}));

export const tokenVersionRelations = relations(tokenVersions, ({ one }) => ({
  token: one(tokens, {
    fields: [tokenVersions.tokenId],
    references: [tokens.id],
  }),
  changedBy: one(users, {
    fields: [tokenVersions.changedByUserId],
    references: [users.id],
  }),
  compositeProperty: one(tokenCompositeProperties, {
    fields: [tokenVersions.compositePropertyId],
    references: [tokenCompositeProperties.id],
  }),
}));
