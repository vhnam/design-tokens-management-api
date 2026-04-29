import { BadRequestException, CanActivate, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import { WorkspaceService } from '../../workspace/workspace.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private readonly workspaceService: WorkspaceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      session?: UserSession;
      workspaceId?: string;
    }>();
    const session = request.session;

    if (!session) {
      throw new BadRequestException('Session is required');
    }

    const fromUser = (session.user as { workspaceId?: string }).workspaceId;
    const fromSession = (session as { session?: { workspaceId?: string } })
      .session?.workspaceId;
    const normalized = (fromUser ?? fromSession)?.trim();

    if (normalized) {
      request.workspaceId = normalized;
      return true;
    }

    const fallbackWorkspaceId =
      await this.workspaceService.findDefaultWorkspaceId(session.user.id);
    if (!fallbackWorkspaceId) {
      throw new BadRequestException('Workspace is required');
    }

    request.workspaceId = fallbackWorkspaceId;
    return true;
  }
}
