import { randomUUID } from 'node:crypto';

import { and, eq, sql } from 'drizzle-orm';

import type { Database } from '../../config/db.config';
import { TokenLevel, TokenType } from '../../enums/token.enum';
import { tokenFiles, tokenGroups, tokenSets } from '../../schema/tokens.schema';

/** Default synthetic set inserted under reserved token files */
export const DEFAULT_TOKEN_SET_NAME = 'default';

const HIERARCHY_LOCK_KIND = {
  primitive: 1,
  semantic: 2,
  component: 3,
} as const;

export type TokenHierarchyLockKind = keyof typeof HIERARCHY_LOCK_KIND;

/**
 * Creates file → set → group for a reserved organization hierarchy in one transaction.
 * Uses `pg_advisory_xact_lock` so concurrent first-time bootstraps are serialized; re-checks
 * existence under the lock so duplicate hierarchies are not created.
 */
export async function ensureTokenHierarchyBootstrap(
  db: Database,
  params: {
    ownerId: string;
    organizationId: string;
    fileName: string;
    groupName: string;
    level: TokenLevel;
    lockKind: TokenHierarchyLockKind;
  },
): Promise<void> {
  const kind = HIERARCHY_LOCK_KIND[params.lockKind];

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${params.organizationId}::text), ${kind}::integer)`,
    );

    const [existing] = await tx
      .select({ id: tokenGroups.id })
      .from(tokenGroups)
      .innerJoin(tokenSets, eq(tokenGroups.setId, tokenSets.id))
      .innerJoin(tokenFiles, eq(tokenSets.fileId, tokenFiles.id))
      .where(
        and(
          eq(tokenFiles.organizationId, params.organizationId),
          eq(tokenFiles.name, params.fileName),
          eq(tokenSets.name, DEFAULT_TOKEN_SET_NAME),
          eq(tokenGroups.name, params.groupName),
          eq(tokenGroups.level, params.level),
        ),
      )
      .limit(1);

    if (existing) {
      return;
    }

    const fileId = randomUUID();
    const setId = randomUUID();
    const groupId = randomUUID();

    await tx.insert(tokenFiles).values({
      id: fileId,
      name: params.fileName,
      description: null,
      ownerId: params.ownerId,
      organizationId: params.organizationId,
    });

    await tx.insert(tokenSets).values({
      id: setId,
      fileId,
      name: DEFAULT_TOKEN_SET_NAME,
      order: 0,
    });

    await tx.insert(tokenGroups).values({
      id: groupId,
      setId,
      parentGroupId: null,
      name: params.groupName,
      level: params.level,
      componentName: null,
      inheritedType: TokenType.String,
      order: 0,
    });
  });
}
