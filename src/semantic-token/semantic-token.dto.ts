export interface SemanticTokenDto {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  workspaceId: string;
}

export interface CreateSemanticTokenDto {
  name: string;
  type: string;
  description?: string | null;
}

export interface UpdateSemanticTokenDto {
  name?: string;
  type?: string;
  description?: string | null;
}
