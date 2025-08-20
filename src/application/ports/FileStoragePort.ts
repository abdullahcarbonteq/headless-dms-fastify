import type { AppResult } from '@carbonteq/hexapp';

export interface SavedFileInfo {
  path: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface FileStoragePort {
  save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>>;
  remove(path: string): Promise<AppResult<boolean>>;
}

