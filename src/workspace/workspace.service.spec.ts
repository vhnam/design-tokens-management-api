import { BadRequestException, NotFoundException } from '@nestjs/common';

import { workspaceMembers, workspaces } from '../schema/workspaces.schema';

import { WorkspaceService } from './workspace.service';

type WorkspaceRowInsert = {
  id: string;
  name: string;
  image: string | null;
  ownerId: string;
};

type WorkspaceMemberInsert = {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
};

let selectPromiseResult: unknown[] = [];

const returningMock = jest.fn();
const whereMock = jest.fn(() => ({ returning: returningMock }));
const setMock = jest.fn(() => ({ where: whereMock }));

const insertValuesMockFirst = jest.fn(() => ({
  returning: returningMock,
})) as unknown as jest.MockedFunction<
  (row: WorkspaceRowInsert) => { returning: typeof returningMock }
>;
const insertValuesMockLater = jest.fn(() => ({
  returning: jest.fn(),
})) as unknown as jest.MockedFunction<
  (row: WorkspaceMemberInsert) => { returning: jest.Mock }
>;

type DbInsertChain = {
  values: typeof insertValuesMockFirst | typeof insertValuesMockLater;
};

const insertMock = jest.fn() as jest.MockedFunction<
  (table: unknown) => DbInsertChain
>;

const updateMock = jest.fn<{ set: typeof setMock }, [unknown]>(() => ({
  set: setMock,
}));
const deleteWhereMock = jest.fn();
const deleteMock = jest.fn<{ where: typeof deleteWhereMock }, [unknown]>(
  () => ({
    where: deleteWhereMock,
  }),
);
const eqMock = jest.fn<string, [unknown, unknown]>(() => 'eq-condition');

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => eqMock(left, right),
}));

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  const dbMock = {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve(selectPromiseResult)),
          then(onFulfilled: (v: unknown) => unknown, onRejected?: unknown) {
            return Promise.resolve(selectPromiseResult).then(
              onFulfilled,
              onRejected as Parameters<Promise<unknown>['then']>[1],
            );
          },
        })),
      })),
    })),
    insert: (table: unknown): DbInsertChain => insertMock(table),
    update: (table: unknown) => updateMock(table),
    delete: (table: unknown) => deleteMock(table),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    selectPromiseResult = [];
    returningMock.mockReset();

    insertMock.mockReset();
    insertMock.mockImplementationOnce(() => ({
      values: insertValuesMockFirst,
    }));
    insertMock.mockImplementation(() => ({
      values: insertValuesMockLater,
    }));

    service = new WorkspaceService(dbMock as never);
  });

  it('should create workspace with normalized fields', async () => {
    returningMock.mockResolvedValue([
      {
        id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        name: 'Design Team',
        image: null,
        ownerId: 'owner-1',
      },
    ]);

    const userId = 'owner-1';

    insertValuesMockLater.mockResolvedValue([] as never);

    const result = await service.create(
      {
        name: '  Design Team  ',
        image: ' ',
      },
      userId,
    );

    expect(insertMock).toHaveBeenNthCalledWith(1, workspaces);
    const workspaceVals = insertValuesMockFirst.mock.calls[0]?.[0];
    expect(workspaceVals).toBeDefined();
    expect(workspaceVals).toMatchObject({
      name: 'Design Team',
      image: null,
      ownerId: userId,
    });
    expect(typeof workspaceVals?.id).toBe('string');
    expect(workspaceVals?.id.length).toBeGreaterThan(0);

    expect(insertMock).toHaveBeenNthCalledWith(2, workspaceMembers);
    const memberVals = insertValuesMockLater.mock.calls[0]?.[0];
    expect(memberVals).toBeDefined();
    expect(memberVals).toMatchObject({
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      userId,
      role: 'owner',
    });
    expect(typeof memberVals?.id).toBe('string');
    expect(memberVals?.id.length).toBeGreaterThan(0);

    expect(result.name).toBe('Design Team');
  });

  it('should throw if create name is empty', async () => {
    await expect(
      service.create({ name: '   ', image: null }, 'u'),
    ).rejects.toThrow(new BadRequestException('Workspace name is required'));
  });

  it('should throw if workspace does not exist', async () => {
    selectPromiseResult = [];

    await expect(
      service.findOne('cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df'),
    ).rejects.toThrow(new NotFoundException('Workspace not found'));
  });

  it('should reject empty update payload', async () => {
    selectPromiseResult = [{ id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' }];

    await expect(
      service.update('cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df', {}),
    ).rejects.toThrow(new BadRequestException('No fields to update'));
  });

  it('should delete workspace and return success payload', async () => {
    selectPromiseResult = [{ id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' }];
    deleteWhereMock.mockResolvedValue(undefined);

    const result = await service.remove('cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df');

    expect(deleteMock).toHaveBeenCalledWith(workspaces);
    expect(eqMock).toHaveBeenCalledWith(
      workspaces.id,
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    );
    expect(result).toEqual({ deleted: true });
  });
});
