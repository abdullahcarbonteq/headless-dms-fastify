import { inject, injectable } from 'tsyringe';
import { AppResult, AppError } from '@carbonteq/hexapp';
import fs from 'fs';
import path from 'path';
import { FileStoragePort, SavedFileInfo } from '../../application/ports/FileStoragePort.js';
import type { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';

@injectable()
export class FileSystemStorageAdapter implements FileStoragePort {
  private readonly uploadDir: string;

  constructor(@inject('IConfigurationService') private readonly config: IConfigurationService) {
    this.uploadDir = this.config.app.upload.uploadDir;
  }

  async save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>> {
    try {
      await fs.promises.mkdir(this.uploadDir, { recursive: true });
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(originalFilename)}`;
      const dest = path.join(this.uploadDir, uniqueName);
      const writeStream = fs.createWriteStream(dest);
      fileStream.pipe(writeStream);
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        fileStream.on('error', reject);
      });
      const stats = await fs.promises.stat(dest);
      const info: SavedFileInfo = { path: dest, filename: originalFilename, mimetype, size: stats.size };
      return AppResult.Ok(info);
    } catch (err) {
      return AppResult.Err(AppError.Generic(err instanceof Error ? err.message : 'Failed to save file'));
    }
  }

  async remove(filePath: string): Promise<AppResult<boolean>> {
    try {
      await fs.promises.unlink(filePath);
      return AppResult.Ok(true);
    } catch (err) {
      return AppResult.Err(AppError.Generic(err instanceof Error ? err.message : 'Failed to remove file'));
    }
  }
}

