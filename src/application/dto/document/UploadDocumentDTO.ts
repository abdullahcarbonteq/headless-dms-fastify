export interface UploadDocumentInput {
  // Raw file stream coming from transport layer
  fileStream: NodeJS.ReadableStream;
  // Original filename provided by client/transport
  filename: string;
  mimetype: string;
  // Optional metadata
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

