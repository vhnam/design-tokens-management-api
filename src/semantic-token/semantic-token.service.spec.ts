import { BadRequestException, NotFoundException } from '@nestjs/common';

import { semanticToken } from '../schema/semantic-token';

import { SemanticTokenDto } from './semantic-token.dto';
import { SemanticTokenService } from './semantic-token.service';

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

jest.mock('../config/db', () => ({
  db: {
    select: () => selectMock(),
    insert: (table: unknown) => insertMock(table),
    update: (table: unknown) => updateMock(table),
    delete: (table: unknown) => deleteMock(table),
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => eqMock(left, right),
  and: (...conditions: unknown[]) => andMock(...conditions),
}));

describe('SemanticTokenService', () => {
  let service: SemanticTokenService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SemanticTokenService();
  });

  it('should create semantic token with normalized fields', async () => {
    returningMock.mockResolvedValue([
      {
        id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        name: 'Text Primary',
        type: 'color',
        description: null,
        workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      },
    ]);

    const result = await service.create({
      name: '  Text Primary  ',
      type: '  color  ',
      description: ' ',
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });

    expect(insertMock).toHaveBeenCalledWith(semanticToken);
    expect(valuesMock).toHaveBeenCalledWith({
      id: expect.any(String) as string,
      name: 'Text Primary',
      type: 'color',
      description: null,
      workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    });
    expect(result.name).toBe('Text Primary');
  });

  it('should throw if create name is empty', async () => {
    await expect(
      service.create({
        name: '   ',
        type: 'color',
        workspaceId: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      }),
    ).rejects.toThrow(
      new BadRequestException('Semantic token name is required'),
    );
  });

  it('should throw if semantic token does not exist', async () => {
    whereMock.mockResolvedValue([] as never) as unknown as SemanticTokenDto[];

    await expect(
      service.findOne(
        'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
      ),
    ).rejects.toThrow(new NotFoundException('Semantic token not found'));
  });

  it('should reject empty update payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as SemanticTokenDto[];

    await expect(
      service.update(
        'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
        'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
        {},
      ),
    ).rejects.toThrow(new BadRequestException('No fields to update'));
  });

  it('should delete semantic token and return success payload', async () => {
    whereMock.mockResolvedValue([
      { id: 'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df' },
    ] as never) as unknown as SemanticTokenDto[];
    deleteWhereMock.mockResolvedValue(undefined);

    const result = await service.remove(
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
      'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
    );

    expect(deleteMock).toHaveBeenCalledWith(semanticToken);
    expect(eqMock).toHaveBeenCalledWith(
      semanticToken.id,
      'cb1d0ab4-2f8c-4ace-a3e7-cf7f2deec8df',
    );
    expect(eqMock).toHaveBeenCalledWith(
      semanticToken.workspaceId,
      'f57b4fbf-96a8-4cb4-aa7d-30f6fa65dfec',
    );
    expect(andMock).toHaveBeenCalled();
    expect(result).toEqual({ deleted: true });
  });
});
