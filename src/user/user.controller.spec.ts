import { Test, TestingModule } from '@nestjs/testing';

import { UserController } from './user.controller';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
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
