const putObjectCommandMock = jest.fn();
const s3ClientMock = jest.fn();
const getSignedUrlMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: function (...args: unknown[]) {
    putObjectCommandMock(...args);
    return { __type: 'PutObjectCommand', args };
  },
  S3Client: function (...args: unknown[]) {
    s3ClientMock(...args);
    return { __type: 'S3Client', args };
  },
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => getSignedUrlMock(...args),
}));

jest.mock('../config/env', () => ({
  getR2Config: () => ({
    accountId: 'acc_123',
    accessKeyId: 'access_key_123',
    secretAccessKey: 'secret_key_123',
    bucket: 'bucket_123',
    publicBaseUrl: 'https://cdn.example.com/',
    endpoint: 'https://acc_123.r2.cloudflarestorage.com',
  }),
}));

import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MediaService();
  });

  it('should configure S3 client with R2 settings', () => {
    expect(s3ClientMock).toHaveBeenCalledWith({
      region: 'auto',
      endpoint: 'https://acc_123.r2.cloudflarestorage.com',
      credentials: {
        accessKeyId: 'access_key_123',
        secretAccessKey: 'secret_key_123',
      },
    });
  });

  describe('createUploadUrl', () => {
    it('should return signed upload response payload', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-upload.example.com');

      const result = await service.createUploadUrl(
        'users/user_1.jpg',
        'image/jpeg',
      );

      expect(putObjectCommandMock).toHaveBeenCalledWith({
        Bucket: 'bucket_123',
        Key: 'users/user_1.jpg',
        ContentType: 'image/jpeg',
      });
      expect(getSignedUrlMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ __type: 'PutObjectCommand' }),
        { expiresIn: 300 },
      );
      expect(result).toEqual({
        uploadUrl: 'https://signed-upload.example.com',
        key: '/users/user_1.jpg',
        imageUrl: 'https://cdn.example.com/users/user_1.jpg',
        expiresIn: 300,
      });
    });

    it('should use provided expiry value', async () => {
      getSignedUrlMock.mockResolvedValue('https://signed-upload.example.com');

      await service.createUploadUrl('users/user_2.png', 'image/png', 120);

      expect(getSignedUrlMock).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        { expiresIn: 120 },
      );
    });
  });

  describe('getPublicUrl', () => {
    it('should safely join public base URL and key', () => {
      expect(service.getPublicUrl('users/user_3.webp')).toBe(
        'https://cdn.example.com/users/user_3.webp',
      );
    });
  });
});
