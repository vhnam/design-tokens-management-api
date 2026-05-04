import { Test, TestingModule } from '@nestjs/testing';

import { DATABASE } from '../database/database.constants';
import { TokenType } from '../enums/token.enum';

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

describe('PrimitiveTokenController', () => {
  let controller: PrimitiveTokenController;
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
        {
          provide: DATABASE,
          useValue: {
            select: jest.fn(() => ({
              from: jest.fn(() => ({
                where: jest.fn(() => ({
                  limit: jest.fn().mockResolvedValue([{ id: 'membership-1' }]),
                })),
              })),
            })),
          },
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
      organizationId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });

    const result = await controller.create(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      {
        name: 'Primary 500',
        type: TokenType.Color,
        rawValue: '#fff',
      },
    );

    expect(primitiveTokenService.create).toHaveBeenCalledWith({
      name: 'Primary 500',
      type: 'color',
      rawValue: '#fff',
      organizationId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
    expect(result).toEqual({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Primary 500',
      type: 'color',
      description: null,
      organizationId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
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
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
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
