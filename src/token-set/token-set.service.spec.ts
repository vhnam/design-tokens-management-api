import { BadRequestException } from '@nestjs/common';

import type { TokenSetDto } from './token-set.dto';
import { TokenSetService } from './token-set.service';

describe('TokenSetService', () => {
  const buildThenableQuery = <T>(result: T) => ({
    then: (onFulfilled: (value: T) => unknown) =>
      Promise.resolve(result).then(onFulfilled),
    catch: (onRejected: (reason: unknown) => unknown) =>
      Promise.resolve(result).catch(onRejected),
    limit: jest.fn().mockResolvedValue(result),
    orderBy: jest.fn().mockResolvedValue(result),
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
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockImplementation(() => {
            const next = selectQueue.shift() ?? [];
            return buildThenableQuery(next);
          }),
        }),
      }),
      insert: jest.fn().mockReturnValue({ values }),
      update: jest.fn().mockReturnValue({ set }),
      delete: jest.fn().mockReturnValue({ where: deleteWhere }),
    };

    return { db, values, set, deleteWhere };
  };

  it('requires a non-empty name on create', async () => {
    const service = new TokenSetService({} as never);
    await expect(service.create('p', 'o', { name: '   ' })).rejects.toThrow(
      new BadRequestException('Token set name is required'),
    );
  });

  it('rejects non-integer order on create', async () => {
    const service = new TokenSetService({} as never);
    await expect(
      service.create('p', 'o', { name: 'light', order: 1.2 }),
    ).rejects.toThrow(
      new BadRequestException('Token set order must be an integer'),
    );
  });

  it('rejects update with no fields', async () => {
    const service = new TokenSetService({} as never);
    await expect(service.update('p', 's', 'o', {})).rejects.toThrow(
      new BadRequestException('No fields to update'),
    );
  });

  it('creates token set with normalized values', async () => {
    const created: TokenSetDto = {
      id: 'set-id',
      fileId: 'project-id',
      name: 'light',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { db, values } = buildDb({
      selectResults: [
        [{ id: 'project-id', name: 'project', organizationId: 'org-id' }],
        [],
      ],
      insertResult: created,
    });
    const service = new TokenSetService(db as never);

    const result = await service.create('project-id', 'org-id', {
      name: '  light  ',
      order: 2,
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'project-id',
        name: 'light',
        order: 2,
      }),
    );
    expect(result).toEqual(created);
  });

  it('finds one and throws when token set is missing', async () => {
    const { db } = buildDb({
      selectResults: [
        [{ id: 'project-id', name: 'project', organizationId: 'org-id' }],
        [],
      ],
    });
    const service = new TokenSetService(db as never);

    await expect(
      service.findOne('project-id', 'set-id', 'org-id'),
    ).rejects.toThrow('Token set not found');
  });

  it('updates token set with trimmed name', async () => {
    const updated: TokenSetDto = {
      id: 'set-id',
      fileId: 'project-id',
      name: 'dark',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { db, set } = buildDb({
      selectResults: [
        [{ id: 'project-id', name: 'project', organizationId: 'org-id' }],
        [
          {
            id: 'set-id',
            fileId: 'project-id',
            name: 'light',
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        [],
      ],
      updateResult: updated,
    });
    const service = new TokenSetService(db as never);

    const result = await service.update('project-id', 'set-id', 'org-id', {
      name: '  dark  ',
      order: 1,
    });

    expect(set).toHaveBeenCalledTimes(1);
    expect(result).toEqual(updated);
  });

  it('removes token set and returns deleted marker', async () => {
    const { db, deleteWhere } = buildDb({
      selectResults: [
        [{ id: 'project-id', name: 'project', organizationId: 'org-id' }],
        [
          {
            id: 'set-id',
            fileId: 'project-id',
            name: 'light',
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      ],
    });
    const service = new TokenSetService(db as never);

    const result = await service.remove('project-id', 'set-id', 'org-id');

    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(deleteWhere).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ deleted: true });
  });
});
