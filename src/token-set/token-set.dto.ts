export interface TokenSetDto {
  id: string;
  fileId: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTokenSetDto {
  name: string;
  order?: number;
}

export interface UpdateTokenSetDto {
  name?: string;
  order?: number;
}
