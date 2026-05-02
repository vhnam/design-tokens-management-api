import { TokenType } from '../enums/token.enum';

export interface PrimitiveTokenDto {
  id: string;
  name: string;
  type: TokenType;
  rawValue: string;
  description?: string | null;
  workspaceId: string;
}

export interface CreatePrimitiveTokenDto {
  name: string;
  type: TokenType;
  rawValue: string;
  description?: string | null;
}

export interface UpdatePrimitiveTokenDto {
  name?: string;
  type?: TokenType;
  rawValue?: string;
  description?: string | null;
}
