import { Test, TestingModule } from '@nestjs/testing';

import { ComponentTokenController } from './component-token.controller';
import { ComponentTokenService } from './component-token.service';

jest.mock('./component-token.service', () => ({
  ComponentTokenService: class {
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

describe('ComponentTokenController', () => {
  let controller: ComponentTokenController;
  const session = {
    user: { id: 'u1', workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
  };
  const componentTokenService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComponentTokenController],
      providers: [
        {
          provide: ComponentTokenService,
          useValue: componentTokenService,
        },
      ],
    }).compile();

    controller = module.get<ComponentTokenController>(ComponentTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create component token', async () => {
    componentTokenService.create.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Button Primary',
      type: 'component',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });

    const result = await controller.create(session as never, {
      name: 'Button Primary',
      type: 'component',
    });

    expect(componentTokenService.create).toHaveBeenCalledWith({
      name: 'Button Primary',
      type: 'component',
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
    expect(result).toEqual({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Button Primary',
      type: 'component',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
  });

  it('should update component token', async () => {
    componentTokenService.update.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Button Secondary',
      type: 'component',
      description: 'updated',
    });

    const result = await controller.update(
      session as never,
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Button Secondary' },
    );

    expect(componentTokenService.update).toHaveBeenCalledWith(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Button Secondary' },
    );
    expect(result.name).toBe('Button Secondary');
  });
});
