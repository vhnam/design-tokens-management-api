import { BadRequestException } from '@nestjs/common';

import { users } from '../schema/auth.schema';

import { UserService } from './user.service';

const whereMock = jest.fn();
const setMock = jest.fn(() => ({ where: whereMock }));
const updateMock = jest.fn<{ set: typeof setMock }, [unknown]>(() => ({
  set: setMock,
}));
const eqMock = jest.fn<string, [unknown, unknown]>(() => 'eq-condition');

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => eqMock(left, right),
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
  const dbMock = {
    update: (table: unknown) => updateMock(table),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    whereMock.mockResolvedValue(undefined);
    service = new UserService(mediaService as never, dbMock as never);
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
      expect(updateMock).toHaveBeenCalledWith(users);
      expect(setMock).toHaveBeenCalledWith({
        image: 'https://cdn.example.com/users/user_1.png',
        updatedAt: expect.any(Date) as Date,
      });
      expect(eqMock).toHaveBeenCalledWith(users.id, 'user_1');
      expect(whereMock).toHaveBeenCalledWith('eq-condition');
      expect(result).toEqual({
        image: 'https://cdn.example.com/users/user_1.png',
      });
    });
  });

  describe('updateProfile', () => {
    it('should update user name after trimming whitespace', async () => {
      const result = await service.updateProfile('user_1', {
        name: '  Updated Name  ',
      });

      expect(updateMock).toHaveBeenCalledWith(users);
      expect(setMock).toHaveBeenCalledWith({
        name: 'Updated Name',
        updatedAt: expect.any(Date) as Date,
      });
      expect(eqMock).toHaveBeenCalledWith(users.id, 'user_1');
      expect(whereMock).toHaveBeenCalledWith('eq-condition');
      expect(result).toEqual({ name: 'Updated Name' });
    });

    it('should throw when no updatable fields are provided', async () => {
      await expect(service.updateProfile('user_1', {})).rejects.toThrow(
        new BadRequestException('No updatable fields provided'),
      );
    });

    it('should throw when name is empty', async () => {
      await expect(
        service.updateProfile('user_1', { name: '   ' }),
      ).rejects.toThrow(new BadRequestException('Name is required'));
    });
  });
});
