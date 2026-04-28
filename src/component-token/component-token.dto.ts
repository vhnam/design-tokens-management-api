export interface ComponentTokenDto {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  workspaceId: string;
}

export interface CreateComponentTokenDto {
  name: string;
  type: string;
  description?: string | null;
}

export interface UpdateComponentTokenDto {
  name?: string;
  type?: string;
  description?: string | null;
}
