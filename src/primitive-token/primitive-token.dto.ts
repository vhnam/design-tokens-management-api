export interface PrimitiveTokenDto {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  workspaceId: string;
}

export interface CreatePrimitiveTokenDto {
  name: string;
  type: string;
  description?: string | null;
}

export interface UpdatePrimitiveTokenDto {
  name?: string;
  type?: string;
  description?: string | null;
}
