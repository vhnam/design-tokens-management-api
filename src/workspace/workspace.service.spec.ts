import { BadRequestException, NotFoundException } from '@nestjs/common';

import { workspace } from '../schema/workspace';

import { WorkspaceDto } from './workspace.dto';
import { WorkspaceService } from './workspace.service';

const returningMock = jest.fn();
const whereMock = jest.fn(() => ({ returning: returningMock }));
const setMock = jest.fn(() => ({ where: whereMock }));
const valuesMock = jest.fn(() => ({ returning: returningMock }));
const fromMock = jest.fn(() => ({ where: whereMock }));
const selectMock = jest.fn(() => ({ from: fromMock }));
const insertMock = jest.fn<{ values: typeof valuesMock }, [unknown]>(() => ({
  values: valuesMock,
}));
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
    select: () => selectMock(),
    insert: (table: unknown) => insertMock(table),
    update: (table: unknown) => updateMock(table),
    delete: (table: unknown) => deleteMock(table),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkspaceService(dbMock as never);
  });

  it('should create workspace with normalized fields', async () => {
    returningMock.mockResolvedValue([
      {
        id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        name: 'Design Team',
        image: null,
      },
    ]);

    const result = await service.create({
      name: '  Design Team  ',
      image: ' ',
    });

    expect(insertMock).toHaveBeenCalledWith(workspace);
    expect(valuesMock).toHaveBeenCalledWith({
      id: expect.any(String) as string,
      name: 'Design Team',
      image: null,
    });
    expect(result.name).toBe('Design Team');
  });

  it('should throw if create name is empty', async () => {
    await expect(service.create({ name: '   ' })).rejects.toThrow(
      new BadRequestException('Workspace name is required'),
    );
  });

  it('should throw if workspace does not exist', async () => {
    whereMock.mockResolvedValue([] as never) as unknown as WorkspaceDto[];

    await expect(
      service.findOne('cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df'),
    ).rejects.toThrow(new NotFoundException('Workspace not found'));
  });

  it('should reject empty update payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as WorkspaceDto[];

    await expect(
      service.update('cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df', {}),
    ).rejects.toThrow(new BadRequestException('No fields to update'));
  });

  it('should delete workspace and return success payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as WorkspaceDto[];
    deleteWhereMock.mockResolvedValue(undefined);

    const result = await service.remove('cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df');

    expect(deleteMock).toHaveBeenCalledWith(workspace);
    expect(eqMock).toHaveBeenCalledWith(
      workspace.id,
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    );
    expect(result).toEqual({ deleted: true });
  });
});
