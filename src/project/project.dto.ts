export interface ProjectDto {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectDto {
  name: string;
  description?: string | null;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string | null;
}
