import { inject, injectable } from 'tsyringe';
import { AppResult, AppError } from '@carbonteq/hexapp';
import fs from 'fs';
import path from 'path';
import { FileStoragePort, SavedFileInfo } from '../../application/ports/FileStoragePort.js';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';
import type { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';

@injectable()
export class FileSystemStorageAdapter implements FileStoragePort {
  private readonly uploadDir: string;

  constructor(
    @inject('IConfigurationService') private readonly config: IConfigurationService,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {
    this.uploadDir = this.config.app.upload.uploadDir;
  }

  async save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>> {
    const work = async (): Promise<AppResult<SavedFileInfo>> => {
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
        const info: SavedFileInfo = {
          path: dest,
          filename: originalFilename,
          mimetype,
          size: stats.size,
          storageProvider: 'fs',
          externalKey: dest,
        };
        return AppResult.Ok(info);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to save file');
        this.obs?.noticeError(error, { storageProvider: 'fs', op: 'save' });
        return AppResult.Err(AppError.Generic(error.message));
      }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/FSAdapter:save', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'fs', filename: originalFilename, mimetype });
        return await work();
      });
    }
    return await work();
  }

  async remove(filePath: string): Promise<AppResult<boolean>> {
    const work = async (): Promise<AppResult<boolean>> => {
      try {
        await fs.promises.unlink(filePath);
        return AppResult.Ok(true);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to remove file');
        this.obs?.noticeError(error, { storageProvider: 'fs', op: 'remove' });
        return AppResult.Err(AppError.Generic(error.message));
      }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/FSAdapter:remove', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'fs', filePath });
        return await work();
      });
    }
    return await work();
  }
}

