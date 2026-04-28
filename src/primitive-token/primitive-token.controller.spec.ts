import { Test, TestingModule } from '@nestjs/testing';

import { PrimitiveTokenController } from './primitive-token.controller';
import { PrimitiveTokenService } from './primitive-token.service';

jest.mock('./primitive-token.service', () => ({
  PrimitiveTokenService: class {
    create = jest.fn();
    findAll = jest.fn();
    findOne = jest.fn();
    update = jest.fn();
    remove = jest.fn();
  },
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {
    canActivate() {
      return true;
    }
  },
  Session: () => () => undefined,
}));

jest.mock('../config/db', () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        limit: jest.fn().mockResolvedValue([]),
      })),
    })),
  },
}));

describe('PrimitiveTokenController', () => {
  let controller: PrimitiveTokenController;
  const session = {
    user: { id: 'u1', workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
  };
  const primitiveTokenService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrimitiveTokenController],
      providers: [
        {
          provide: PrimitiveTokenService,
          useValue: primitiveTokenService,
        },
      ],
    }).compile();

    controller = module.get<PrimitiveTokenController>(PrimitiveTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create primitive token', async () => {
    primitiveTokenService.create.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Primary 500',
      type: 'color',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });

    const result = await controller.create(session as never, {
      name: 'Primary 500',
      type: 'color',
    });

    expect(primitiveTokenService.create).toHaveBeenCalledWith({
      name: 'Primary 500',
      type: 'color',
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
    expect(result).toEqual({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Primary 500',
      type: 'color',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
  });

  it('should update primitive token', async () => {
    primitiveTokenService.update.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Primary 600',
      type: 'color',
      description: 'updated',
    });

    const result = await controller.update(
      session as never,
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Primary 600' },
    );

    expect(primitiveTokenService.update).toHaveBeenCalledWith(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Primary 600' },
    );
    expect(result.name).toBe('Primary 600');
  });
});
