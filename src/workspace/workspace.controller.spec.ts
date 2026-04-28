import { Test, TestingModule } from '@nestjs/testing';

import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

jest.mock('./workspace.service', () => ({
  WorkspaceService: class {
    create = jest.fn();
    findAll = jest.fn();
    findOne = jest.fn();
    update = jest.fn();
    remove = jest.fn();
  },
}));

describe('WorkspaceController', () => {
  let controller: WorkspaceController;
  const workspaceService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceController],
      providers: [
        {
          provide: WorkspaceService,
          useValue: workspaceService,
        },
      ],
    }).compile();

    controller = module.get<WorkspaceController>(WorkspaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create workspace', async () => {
    workspaceService.create.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Design',
      image: null,
    });

    const result = await controller.create({ name: 'Design' });

    expect(workspaceService.create).toHaveBeenCalledWith({ name: 'Design' });
    expect(result).toEqual({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Design',
      image: null,
    });
  });

  it('should update workspace', async () => {
    workspaceService.update.mockResolvedValue({
      id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      name: 'Workspace 2',
      image: 'https://example.com/w.png',
    });

    const result = await controller.update(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Workspace 2' },
    );

    expect(workspaceService.update).toHaveBeenCalledWith(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      { name: 'Workspace 2' },
    );
    expect(result.name).toBe('Workspace 2');
  });
});
