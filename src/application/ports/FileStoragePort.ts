import type { AppResult } from '@carbonteq/hexapp';

export interface SavedFileInfo {
  path: string;
  filename: string;
  mimetype: string;
  size: number;
  storageProvider?: string;
  externalKey?: string | null;
}

export interface FileStoragePort {
  save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>>;
  remove(path: string): Promise<AppResult<boolean>>;
  getPresignedDownloadUrl?(pathOrKey: string, expiresSeconds: number): Promise<AppResult<{ url: string; expiresAt: Date }>>;
  readStream?(pathOrKey: string): Promise<AppResult<NodeJS.ReadableStream>>;
}

