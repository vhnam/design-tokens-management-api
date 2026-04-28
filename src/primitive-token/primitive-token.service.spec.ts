import { BadRequestException, NotFoundException } from '@nestjs/common';

import { primitiveToken } from '../schema/primitive-token';

import { PrimitiveTokenDto } from './primitive-token.dto';
import { PrimitiveTokenService } from './primitive-token.service';

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
const eqMock = jest.fn(() => 'eq-condition');
const andMock = jest.fn(() => 'and-condition');

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => eqMock(left, right),
  and: (...conditions: unknown[]) => andMock(...conditions),
}));

describe('PrimitiveTokenService', () => {
  let service: PrimitiveTokenService;
  const dbMock = {
    select: () => selectMock(),
    insert: (table: unknown) => insertMock(table),
    update: (table: unknown) => updateMock(table),
    delete: (table: unknown) => deleteMock(table),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PrimitiveTokenService(dbMock as never);
  });

  it('should create primitive token with normalized fields', async () => {
    returningMock.mockResolvedValue([
      {
        id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        name: 'Primary 500',
        type: 'color',
        description: null,
        workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      },
    ]);

    const result = await service.create({
      name: '  Primary 500  ',
      type: '  color  ',
      description: ' ',
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });

    expect(insertMock).toHaveBeenCalledWith(primitiveToken);
    expect(valuesMock).toHaveBeenCalledWith({
      id: expect.any(String) as string,
      name: 'Primary 500',
      type: 'color',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
    expect(result.name).toBe('Primary 500');
  });

  it('should throw if create name is empty', async () => {
    await expect(
      service.create({
        name: '   ',
        type: 'color',
        workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      }),
    ).rejects.toThrow(
      new BadRequestException('Primitive token name is required'),
    );
  });

  it('should throw if primitive token does not exist', async () => {
    whereMock.mockResolvedValue([] as never) as unknown as PrimitiveTokenDto[];

    await expect(
      service.findOne(
        'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
      ),
    ).rejects.toThrow(new NotFoundException('Primitive token not found'));
  });

  it('should reject empty update payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as PrimitiveTokenDto[];

    await expect(
      service.update(
        'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
        {},
      ),
    ).rejects.toThrow(new BadRequestException('No fields to update'));
  });

  it('should delete primitive token and return success payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as PrimitiveTokenDto[];
    deleteWhereMock.mockResolvedValue(undefined);

    const result = await service.remove(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
    );

    expect(deleteMock).toHaveBeenCalledWith(primitiveToken);
    expect(eqMock).toHaveBeenCalledWith(
      primitiveToken.id,
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    );
    expect(eqMock).toHaveBeenCalledWith(
      primitiveToken.workspaceId,
      'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
    );
    expect(andMock).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});
