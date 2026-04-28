import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

export const WorkspaceId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ workspaceId?: string }>();
    return request.workspaceId ?? '';
  },
);
