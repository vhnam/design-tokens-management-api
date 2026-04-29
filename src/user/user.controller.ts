import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import {
  AllowAnonymous,
  AuthGuard,
  OptionalAuth,
  Session,
} from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@Session() session: UserSession) {
    return { user: session.user };
  }

  @Post('me/avatar/upload-url')
  @UseGuards(AuthGuard)
  createAvatarUploadUrl(
    @Session() session: UserSession,
    @Body() body: { extension: string; contentType: string },
  ) {
    return this.userService.createAvatarUploadUrl(
      session.user.id,
      body.extension,
      body.contentType,
    );
  }

  @Patch('me/avatar')
  @UseGuards(AuthGuard)
  saveAvatarImage(
    @Session() session: UserSession,
    @Body() body: { extension: string },
  ) {
    return this.userService.saveAvatarImage(session.user.id, body.extension);
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  updateProfile(
    @Session() session: UserSession,
    @Body() body: { name?: string },
  ) {
    return this.userService.updateProfile(session.user.id, body);
  }

  @Get('public')
  @AllowAnonymous() // Allow anonymous access
  getPublic() {
    return { message: 'Public route' };
  }

  @Get('optional')
  @OptionalAuth() // Authentication is optional
  getOptional(@Session() session: UserSession) {
    return { authenticated: !!session };
  }
}
