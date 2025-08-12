import { Result } from '@carbonteq/fp';

export interface SavedFileInfo {
  path: string;
  filename: string;
  mimetype: string;
  size: number;
}

export interface FileStoragePort {
  save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<Result<SavedFileInfo, Error>>;
  remove(path: string): Promise<Result<boolean, Error>>;
}

