export interface WorkspaceDto {
  id: string;
  name: string;
  image?: string | null;
}

export interface CreateWorkspaceDto {
  name: string;
  image?: string | null;
}

export interface UpdateWorkspaceDto {
  name?: string;
  image?: string | null;
}
