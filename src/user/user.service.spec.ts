import { BadRequestException } from '@nestjs/common';

import { user } from '../schema/auth';

import { UserService } from './user.service';

const whereMock = jest.fn();
const setMock = jest.fn(() => ({ where: whereMock }));
const updateMock = jest.fn(() => ({ set: setMock }));
const eqMock = jest.fn(() => 'eq-condition');

jest.mock('../config/db', () => ({
  db: {
    update: updateMock,
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: eqMock,
}));

jest.mock('../media/media.service', () => ({
  MediaService: class {
    createUploadUrl = jest.fn();
    getPublicUrl = jest.fn();
  },
}));

describe('UserService', () => {
  let service: UserService;
  const mediaService = {
    createUploadUrl: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    whereMock.mockResolvedValue(undefined);
    service = new UserService(mediaService as never);
  });

  describe('createAvatarUploadUrl', () => {
    it('should create upload URL with normalized key', async () => {
      mediaService.createUploadUrl.mockResolvedValue({
        uploadUrl: 'https://example.com/upload',
      });

      const result = await service.createAvatarUploadUrl(
        'user_1',
        'jpeg',
        'image/jpeg',
      );

      expect(mediaService.createUploadUrl).toHaveBeenCalledWith(
        'users/user_1.jpg',
        'image/jpeg',
        300,
      );
      expect(result).toEqual({ uploadUrl: 'https://example.com/upload' });
    });

    it('should throw for unsupported image extension', async () => {
      await expect(
        service.createAvatarUploadUrl('user_1', 'svg', 'image/svg+xml'),
      ).rejects.toThrow(new BadRequestException('Unsupported image extension'));
    });

    it('should throw for unsupported image content type', async () => {
      await expect(
        service.createAvatarUploadUrl('user_1', 'jpg', 'image/svg+xml'),
      ).rejects.toThrow(
        new BadRequestException('Unsupported image content type'),
      );
    });
  });

  describe('saveAvatarImage', () => {
    it('should update user image using deterministic key', async () => {
      mediaService.getPublicUrl.mockReturnValue(
        'https://cdn.example.com/users/user_1.png',
      );

      const result = await service.saveAvatarImage('user_1', 'png');

      expect(mediaService.getPublicUrl).toHaveBeenCalledWith(
        'users/user_1.png',
      );
      expect(updateMock).toHaveBeenCalledWith(user);
      expect(setMock).toHaveBeenCalledWith({
        image: 'https://cdn.example.com/users/user_1.png',
        updatedAt: expect.any(Date) as Date,
      });
      expect(eqMock).toHaveBeenCalledWith(user.id, 'user_1');
      expect(whereMock).toHaveBeenCalledWith('eq-condition');
      expect(result).toEqual({
        image: 'https://cdn.example.com/users/user_1.png',
      });
    });
  });
});
