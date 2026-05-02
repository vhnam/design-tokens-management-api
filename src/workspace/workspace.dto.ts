export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface WorkspaceDto {
  id: string;
  name: string;
  image?: string | null;
  ownerId: string;
}

export interface CreateWorkspaceDto {
  name: string;
  image?: string | null;
}

export interface UpdateWorkspaceDto {
  name?: string;
  image?: string | null;
}
