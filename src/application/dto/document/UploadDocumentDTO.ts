export interface UploadDocumentInput {
  filename: string;
  mimetype: string;
  path: string;
  tags?: string[];
  description?: string | null;
  userId: string;
}

export interface UploadDocumentOutput {
  id: string;
  filename: string;
  mimetype: string;
  path: string;
  tags: string[];
  description: string | null;
  userId: string;
}

