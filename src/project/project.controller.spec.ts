import { Test, TestingModule } from '@nestjs/testing';

import { DATABASE } from '../database/database.constants';

import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {
    canActivate() {
      return true;
    }
  },
  Session: () => () => undefined,
}));

describe('ProjectController', () => {
  let controller: ProjectController;
  const projectService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: ProjectService,
          useValue: projectService,
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

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create project', async () => {
    const dto = { name: 'Design system', description: 'Main project' };
    const created = {
      id: 'project-id',
      name: 'Design system',
      description: 'Main project',
      ownerId: 'user-id',
      organizationId: 'org-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    projectService.create.mockResolvedValue(created);

    const result = await controller.create(
      { user: { id: 'user-id' } } as never,
      'org-id',
      dto,
    );

    expect(projectService.create).toHaveBeenCalledWith(
      dto,
      'org-id',
      'user-id',
    );
    expect(result).toEqual(created);
  });

  it('should find all projects', async () => {
    const rows = [{ id: 'project-id', name: 'Design system' }];
    projectService.findAll.mockResolvedValue(rows);

    const result = await controller.findAll('org-id');

    expect(projectService.findAll).toHaveBeenCalledWith('org-id');
    expect(result).toEqual(rows);
  });

  it('should find one project', async () => {
    const row = { id: 'project-id', name: 'Design system' };
    projectService.findOne.mockResolvedValue(row);

    const result = await controller.findOne('org-id', 'project-id');

    expect(projectService.findOne).toHaveBeenCalledWith('project-id', 'org-id');
    expect(result).toEqual(row);
  });

  it('should update project', async () => {
    const dto = { name: 'DS v2' };
    const updated = { id: 'project-id', name: 'DS v2' };
    projectService.update.mockResolvedValue(updated);

    const result = await controller.update('org-id', 'project-id', dto);

    expect(projectService.update).toHaveBeenCalledWith(
      'project-id',
      'org-id',
      dto,
    );
    expect(result).toEqual(updated);
  });

  it('should remove project', async () => {
    projectService.remove.mockResolvedValue({ deleted: true });

    const result = await controller.remove('org-id', 'project-id');

    expect(projectService.remove).toHaveBeenCalledWith('project-id', 'org-id');
    expect(result).toEqual({ deleted: true });
  });
});
