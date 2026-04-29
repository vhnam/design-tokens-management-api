import { BadRequestException, NotFoundException } from '@nestjs/common';

import { componentToken } from '../schema/component-token';

import { ComponentTokenDto } from './component-token.dto';
import { ComponentTokenService } from './component-token.service';

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
const eqMock = jest.fn((left: unknown, right: unknown) => {
  void left;
  void right;
  return 'eq-condition';
});
const andMock = jest.fn((...conditions: unknown[]) => {
  void conditions;
  return 'and-condition';
});

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => eqMock(left, right),
  and: (...conditions: unknown[]) => andMock(...conditions),
}));

describe('ComponentTokenService', () => {
  let service: ComponentTokenService;
  const dbMock = {
    select: () => selectMock(),
    insert: (table: unknown) => insertMock(table),
    update: (table: unknown) => updateMock(table),
    delete: (table: unknown) => deleteMock(table),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ComponentTokenService(dbMock as never);
  });

  it('should create component token with normalized fields', async () => {
    returningMock.mockResolvedValue([
      {
        id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        name: 'Button Primary',
        type: 'component',
        description: null,
        workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      },
    ]);

    const result = await service.create({
      name: '  Button Primary  ',
      type: '  component  ',
      description: ' ',
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });

    expect(insertMock).toHaveBeenCalledWith(componentToken);
    expect(valuesMock).toHaveBeenCalledWith({
      id: expect.any(String) as string,
      name: 'Button Primary',
      type: 'component',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
    expect(result.name).toBe('Button Primary');
  });

  it('should throw if create name is empty', async () => {
    await expect(
      service.create({
        name: '   ',
        type: 'component',
        workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      }),
    ).rejects.toThrow(
      new BadRequestException('Component token name is required'),
    );
  });

  it('should throw if component token does not exist', async () => {
    whereMock.mockResolvedValue([] as never) as unknown as ComponentTokenDto[];

    await expect(
      service.findOne(
        'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
      ),
    ).rejects.toThrow(new NotFoundException('Component token not found'));
  });

  it('should reject empty update payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as ComponentTokenDto[];

    await expect(
      service.update(
        'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
        {},
      ),
    ).rejects.toThrow(new BadRequestException('No fields to update'));
  });

  it('should delete component token and return success payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as ComponentTokenDto[];
    deleteWhereMock.mockResolvedValue(undefined);

    const result = await service.remove(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
    );

    expect(deleteMock).toHaveBeenCalledWith(componentToken);
    expect(eqMock).toHaveBeenCalledWith(
      componentToken.id,
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    );
    expect(eqMock).toHaveBeenCalledWith(
      componentToken.workspaceId,
      'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
    );
    expect(andMock).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});
