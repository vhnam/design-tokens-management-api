import { Test, TestingModule } from '@nestjs/testing';

import { WorkspaceService } from '../workspace/workspace.service';

import { SemanticTokenController } from './semantic-token.controller';
import { SemanticTokenService } from './semantic-token.service';

jest.mock('./semantic-token.service', () => ({
  SemanticTokenService: class {
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

describe('SemanticTokenController', () => {
  let controller: SemanticTokenController;
  const semanticTokenService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SemanticTokenController],
      providers: [
        {
          provide: SemanticTokenService,
          useValue: semanticTokenService,
        },
        {
          provide: WorkspaceService,
          useValue: {
            findDefaultWorkspaceId: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    }).compile();

    controller = module.get<SemanticTokenController>(SemanticTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create semantic token', async () => {
    semanticTokenService.create.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Text Primary',
      type: 'color',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });

    const result = await controller.create(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      {
        name: 'Text Primary',
        type: 'color',
      },
    );

    expect(semanticTokenService.create).toHaveBeenCalledWith({
      name: 'Text Primary',
      type: 'color',
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
    expect(result).toEqual({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Text Primary',
      type: 'color',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
  });

  it('should update semantic token', async () => {
    semanticTokenService.update.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Text Secondary',
      type: 'color',
      description: 'updated',
    });

    const result = await controller.update(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Text Secondary' },
    );

    expect(semanticTokenService.update).toHaveBeenCalledWith(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Text Secondary' },
    );
    expect(result.name).toBe('Text Secondary');
  });
});
