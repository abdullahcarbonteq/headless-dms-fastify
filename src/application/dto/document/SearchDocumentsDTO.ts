export interface SearchDocumentsInput {
  tags?: string[];
  description?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface SearchDocumentsOutputItem {
  id: string;
  filename: string;
  mimetype: string;
  path: string;
  tags: string[];
  description: string | null;
  userId: string;
}

export interface PaginatedSearchDocumentsOutput {
  data: SearchDocumentsOutputItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

