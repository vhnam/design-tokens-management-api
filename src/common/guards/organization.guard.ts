import {
  BadRequestException,
  CanActivate,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { and, eq } from 'drizzle-orm';

import type { Database } from '../../config/db.config';
import { DATABASE } from '../../database/database.constants';
import { members } from '../../schema/auth.schema';

@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      session?: UserSession;
      activeOrganizationId?: string;
    }>();
    const session = request.session;

    if (!session) {
      throw new BadRequestException('Session is required');
    }

    const fromUser = (
      session.user as { activeOrganizationId?: string; organizationId?: string }
    ).activeOrganizationId;
    const fromSession = (
      session as {
        session?: { activeOrganizationId?: string; organizationId?: string };
      }
    ).session?.activeOrganizationId;
    const legacyFromUser = (session.user as { organizationId?: string })
      .organizationId;
    const legacyFromSession = (
      session as { session?: { organizationId?: string } }
    ).session?.organizationId;
    const normalized = (
      fromUser ??
      fromSession ??
      legacyFromUser ??
      legacyFromSession
    )?.trim();

    if (normalized) {
      const [membership] = await this.db
        .select({ id: members.id })
        .from(members)
        .where(
          and(
            eq(members.organizationId, normalized),
            eq(members.userId, session.user.id),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new ForbiddenException(
          'User is not a member of the active organization',
        );
      }

      request.activeOrganizationId = normalized;
      return true;
    }

    throw new BadRequestException('Active organization is required');
  }
}
