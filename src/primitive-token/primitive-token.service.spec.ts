import { BadRequestException } from '@nestjs/common';

import { TokenType } from '../enums/token.enum';

import { PrimitiveTokenService } from './primitive-token.service';

describe('PrimitiveTokenService', () => {
  it('requires name', async () => {
    const service = new PrimitiveTokenService({} as never);
    await expect(
      service.create({
        name: '   ',
        type: TokenType.Color,
        value: '#fff',
        workspaceId: 'w',
      }),
    ).rejects.toThrow(
      new BadRequestException('Primitive token name is required'),
    );
  });

  it('requires value', async () => {
    const service = new PrimitiveTokenService({} as never);
    await expect(
      service.create({
        name: 'x',
        type: TokenType.Color,
        value: '   ',
        workspaceId: 'w',
      }),
    ).rejects.toThrow(
      new BadRequestException('Primitive token value is required'),
    );
  });

  it('requires a valid TokenType enum value', async () => {
    const service = new PrimitiveTokenService({} as never);
    await expect(
      service.create({
        name: 'x',
        type: 'not-a-real-type' as TokenType,
        value: 'y',
        workspaceId: 'w',
      }),
    ).rejects.toThrow(
      new BadRequestException('Primitive token type is invalid'),
    );
  });
});
