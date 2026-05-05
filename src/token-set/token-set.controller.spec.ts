import { Test, TestingModule } from '@nestjs/testing';

import { DATABASE } from '../database/database.constants';

import { TokenSetController } from './token-set.controller';
import { TokenSetService } from './token-set.service';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthGuard: class {
    canActivate() {
      return true;
    }
  },
}));

describe('TokenSetController', () => {
  let controller: TokenSetController;
  const tokenSetService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenSetController],
      providers: [
        {
          provide: TokenSetService,
          useValue: tokenSetService,
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

    controller = module.get<TokenSetController>(TokenSetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create token set', async () => {
    const createDto = { name: 'Light', order: 1 };
    const created = {
      id: 'set-id',
      fileId: 'project-id',
      name: 'Light',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tokenSetService.create.mockResolvedValue(created);

    const result = await controller.create('org-id', 'project-id', createDto);

    expect(tokenSetService.create).toHaveBeenCalledWith(
      'project-id',
      'org-id',
      createDto,
    );
    expect(result).toEqual(created);
  });

  it('should get all token sets', async () => {
    const rows = [
      {
        id: 'set-id',
        fileId: 'project-id',
        name: 'Light',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    tokenSetService.findAll.mockResolvedValue(rows);

    const result = await controller.findAll('org-id', 'project-id');

    expect(tokenSetService.findAll).toHaveBeenCalledWith(
      'project-id',
      'org-id',
    );
    expect(result).toEqual(rows);
  });

  it('should get one token set', async () => {
    const row = {
      id: 'set-id',
      fileId: 'project-id',
      name: 'Dark',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tokenSetService.findOne.mockResolvedValue(row);

    const result = await controller.findOne('org-id', 'project-id', 'set-id');

    expect(tokenSetService.findOne).toHaveBeenCalledWith(
      'project-id',
      'set-id',
      'org-id',
    );
    expect(result).toEqual(row);
  });

  it('should update token set', async () => {
    const updateDto = { name: 'Brand', order: 3 };
    const updated = {
      id: 'set-id',
      fileId: 'project-id',
      name: 'Brand',
      order: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tokenSetService.update.mockResolvedValue(updated);

    const result = await controller.update(
      'org-id',
      'project-id',
      'set-id',
      updateDto,
    );

    expect(tokenSetService.update).toHaveBeenCalledWith(
      'project-id',
      'set-id',
      'org-id',
      updateDto,
    );
    expect(result).toEqual(updated);
  });

  it('should remove token set', async () => {
    tokenSetService.remove.mockResolvedValue({ deleted: true });

    const result = await controller.remove('org-id', 'project-id', 'set-id');

    expect(tokenSetService.remove).toHaveBeenCalledWith(
      'project-id',
      'set-id',
      'org-id',
    );
    expect(result).toEqual({ deleted: true });
  });
});
