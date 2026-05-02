import { BadRequestException } from '@nestjs/common';

import { TokenType } from '../enums/token.enum';

import { SemanticTokenService } from './semantic-token.service';

describe('SemanticTokenService', () => {
  it('requires name', async () => {
    const service = new SemanticTokenService({} as never);
    await expect(
      service.create({
        name: '   ',
        type: TokenType.Color,
        workspaceId: 'w',
      }),
    ).rejects.toThrow(
      new BadRequestException('Semantic token name is required'),
    );
  });
});
