export interface UpdateDocumentMetadataInput {
  id: string;
  tags?: string[];
  description?: string | null;
}

export interface UpdateDocumentMetadataOutput {
  id: string;
  tags: string[];
  description: string | null;
}

