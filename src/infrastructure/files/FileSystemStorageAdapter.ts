import { injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import fs from 'fs';
import path from 'path';
import { FileStoragePort, SavedFileInfo } from '../../application/ports/FileStoragePort.js';
import { ConfigurationService } from '../config/ConfigurationService.js';

@injectable()
export class FileSystemStorageAdapter implements FileStoragePort {
  private readonly uploadDir: string;

  constructor() {
    // We can safely read config statically here; or inject a config port later if needed
    const config = new ConfigurationService();
    this.uploadDir = config.app.upload.uploadDir;
  }

  async save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<Result<SavedFileInfo, Error>> {
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
      return Result.Ok(info);
    } catch (err) {
      return Result.Err(err instanceof Error ? err : new Error('Failed to save file'));
    }
  }

  async remove(filePath: string): Promise<Result<boolean, Error>> {
    try {
      await fs.promises.unlink(filePath);
      return Result.Ok(true);
    } catch (err) {
      return Result.Err(err instanceof Error ? err : new Error('Failed to remove file'));
    }
  }
}

