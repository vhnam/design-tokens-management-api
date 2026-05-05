import { BadRequestException, ConflictException } from '@nestjs/common';

import type { ProjectDto } from './project.dto';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  const buildThenableQuery = <T>(result: T) => ({
    then: (onFulfilled: (value: T) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
    catch: (onRejected: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(onRejected),
    limit: jest.fn().mockResolvedValue(result),
  });

  const buildDb = ({
    selectResults = [],
    insertResult,
    updateResult,
  }: {
    selectResults?: unknown[][];
    insertResult?: unknown;
    updateResult?: unknown;
  }) => {
    const selectQueue = [...selectResults];
    const values = jest.fn().mockReturnValue({
      returning: jest
        .fn()
        .mockResolvedValue(insertResult ? [insertResult] : []),
    });
    const set = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockResolvedValue(updateResult ? [updateResult] : []),
      }),
    });
    const deleteWhere = jest.fn().mockResolvedValue(undefined);

    const db = {
      select: jest.fn().mockImplementation(() => {
        const selectBuilder = {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockImplementation(() => {
              const next = selectQueue.shift() ?? [];
              return buildThenableQuery(next);
            }),
          }),
        };
        return selectBuilder;
      }),
      insert: jest.fn().mockReturnValue({ values }),
      update: jest.fn().mockReturnValue({ set }),
      delete: jest.fn().mockReturnValue({ where: deleteWhere }),
    };

    return { db, values, set, deleteWhere };
  };

  it('requires non-empty project name on create', async () => {
    const service = new ProjectService({} as never);

    await expect(
      service.create({ name: '   ' }, 'org-id', 'owner-id'),
    ).rejects.toThrow(new BadRequestException('Project name is required'));
  });

  it('rejects reserved project names on create', async () => {
    const service = new ProjectService({} as never);

    await expect(
      service.create({ name: '__primitive_tokens__' }, 'org-id', 'owner-id'),
    ).rejects.toThrow(new BadRequestException('This project name is reserved'));
  });

  it('creates project with trimmed name and nullable description', async () => {
    const created: ProjectDto = {
      id: 'project-id',
      name: 'Design system',
      description: null,
      ownerId: 'owner-id',
      organizationId: 'org-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { db, values } = buildDb({
      selectResults: [[]],
      insertResult: created,
    });
    const service = new ProjectService(db as never);

    const result = await service.create(
      { name: '  Design system  ', description: '   ' },
      'org-id',
      'owner-id',
    );

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Design system',
        description: null,
        ownerId: 'owner-id',
        organizationId: 'org-id',
      }),
    );
    expect(result).toEqual(created);
  });

  it('throws conflict when project name already exists', async () => {
    const { db } = buildDb({
      selectResults: [[{ id: 'existing-id' }]],
    });
    const service = new ProjectService(db as never);

    await expect(
      service.create({ name: 'Design system' }, 'org-id', 'owner-id'),
    ).rejects.toThrow(
      new ConflictException(
        'A project with this name already exists in the organization',
      ),
    );
  });

  it('rejects update when no fields are provided', async () => {
    const { db } = buildDb({
      selectResults: [
        [
          {
            id: 'project-id',
            name: 'Design system',
            description: null,
            ownerId: 'owner-id',
            organizationId: 'org-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ],
    });
    const service = new ProjectService(db as never);

    await expect(service.update('project-id', 'org-id', {})).rejects.toThrow(
      new BadRequestException('No fields to update'),
    );
  });

  it('updates project with normalized values', async () => {
    const updated: ProjectDto = {
      id: 'project-id',
      name: 'DS v2',
      description: null,
      ownerId: 'owner-id',
      organizationId: 'org-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { db, set } = buildDb({
      selectResults: [
        [
          {
            id: 'project-id',
            name: 'Design system',
            description: 'Old',
            ownerId: 'owner-id',
            organizationId: 'org-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [],
      ],
      updateResult: updated,
    });
    const service = new ProjectService(db as never);

    const result = await service.update('project-id', 'org-id', {
      name: '  DS v2  ',
      description: '   ',
    });

    expect(set).toHaveBeenCalledTimes(1);
    expect(result).toEqual(updated);
  });

  it('removes project and returns deleted marker', async () => {
    const { db, deleteWhere } = buildDb({
      selectResults: [
        [
          {
            id: 'project-id',
            name: 'Design system',
            description: null,
            ownerId: 'owner-id',
            organizationId: 'org-id',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ],
    });
    const service = new ProjectService(db as never);

    const result = await service.remove('project-id', 'org-id');

    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ deleted: true });
  });
});
