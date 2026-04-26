import { Test, TestingModule } from '@nestjs/testing';

import { UserController } from './user.controller';
import { UserService } from './user.service';

jest.mock('./user.service', () => ({
  UserService: class {
    createAvatarUploadUrl = jest.fn();
    saveAvatarImage = jest.fn();
  },
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => () => undefined,
  AuthGuard: class {
    canActivate() {
      return true;
    }
  },
  OptionalAuth: () => () => undefined,
  Session: () => () => undefined,
}));

describe('UserController', () => {
  let controller: UserController;
  const userService = {
    createAvatarUploadUrl: jest.fn(),
    saveAvatarImage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return user from session', () => {
      const session = { user: { id: 'user_1', email: 'test@example.com' } };

      expect(controller.getProfile(session as never)).toEqual({
        user: session.user,
      });
    });
  });

  describe('getPublic', () => {
    it('should return public route message', () => {
      expect(controller.getPublic()).toEqual({ message: 'Public route' });
    });
  });

  describe('createAvatarUploadUrl', () => {
    it('should delegate to user service with current user id', async () => {
      userService.createAvatarUploadUrl.mockResolvedValue({
        uploadUrl: 'https://example.com/upload',
      });

      const session = { user: { id: 'user_1' } };
      const body = { extension: 'png', contentType: 'image/png' };
      const result = await controller.createAvatarUploadUrl(
        session as never,
        body,
      );

      expect(userService.createAvatarUploadUrl).toHaveBeenCalledWith(
        'user_1',
        'png',
        'image/png',
      );
      expect(result).toEqual({ uploadUrl: 'https://example.com/upload' });
    });
  });

  describe('saveAvatarImage', () => {
    it('should delegate image save to user service with current user id', async () => {
      userService.saveAvatarImage.mockResolvedValue({
        image: 'https://cdn.example.com/users/user_1.png',
      });

      const session = { user: { id: 'user_1' } };
      const body = { extension: 'png' };
      const result = await controller.saveAvatarImage(session as never, body);

      expect(userService.saveAvatarImage).toHaveBeenCalledWith('user_1', 'png');
      expect(result).toEqual({
        image: 'https://cdn.example.com/users/user_1.png',
      });
    });
  });

  describe('getOptional', () => {
    it('should return authenticated true when session exists', () => {
      expect(
        controller.getOptional({ user: { id: 'user_1' } } as never),
      ).toEqual({ authenticated: true });
    });

    it('should return authenticated false when session is missing', () => {
      expect(controller.getOptional(undefined as never)).toEqual({
        authenticated: false,
      });
    });
  });
});
