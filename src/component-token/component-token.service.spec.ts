import { BadRequestException } from '@nestjs/common';

import { TokenType } from '../enums/token.enum';

import { ComponentTokenService } from './component-token.service';

describe('ComponentTokenService', () => {
  it('requires name', async () => {
    const service = new ComponentTokenService({} as never);
    await expect(
      service.create({
        name: '   ',
        type: TokenType.Color,
        workspaceId: 'w',
      }),
    ).rejects.toThrow(
      new BadRequestException('Component token name is required'),
    );
  });
});
