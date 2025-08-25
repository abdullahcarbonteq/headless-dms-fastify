import { inject, injectable } from 'tsyringe';
import { AppResult, AppError } from '@carbonteq/hexapp';
import type { FileStoragePort, SavedFileInfo } from '../../application/ports/FileStoragePort.js';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';
import type { IConfigurationService, StorageConfig, StorageProvider } from '../../shared/interfaces/IConfigurationService.js';

@injectable()
export class FileStorageStrategy implements FileStoragePort {
  private readonly cfg: StorageConfig;

  constructor(
    @inject('IConfigurationService') private readonly config: IConfigurationService,
    @inject('FileSystemStorageAdapter') private readonly fsAdapter: FileStoragePort,
    @inject('S3StorageAdapter') private readonly s3Adapter?: FileStoragePort,
    @inject('GCSStorageAdapter') private readonly gcsAdapter?: FileStoragePort,
    @inject('AzureBlobStorageAdapter') private readonly azureAdapter?: FileStoragePort,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {
    this.cfg = config.storage;
  }

  private pickAdapter(preferred?: StorageProvider): FileStoragePort | undefined {
    const provider = preferred ?? this.cfg.provider;
    switch (provider) {
      case 'fs': return this.fsAdapter;
      case 's3': return this.s3Adapter;
      case 'gcs': return this.gcsAdapter;
      case 'azure': return this.azureAdapter;
      default: return this.fsAdapter;
    }
  }

  private pickByPath(path: string): FileStoragePort | undefined {
    if (path.startsWith('s3://')) return this.s3Adapter;
    if (path.startsWith('gcs://')) return this.gcsAdapter;
    if (path.startsWith('azure://')) return this.azureAdapter;
    return this.fsAdapter;
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Operation timed out')), ms);
    });
    try {
      const result = await Promise.race([promise, timeout]);
      if (timer) clearTimeout(timer);
      // @ts-ignore
      return result as T;
    } catch (err) {
      if (timer) clearTimeout(timer);
      throw err;
    }
  }

  private providersInOrder(): StorageProvider[] {
    if (this.cfg.provider !== 'multi') return [this.cfg.provider];
    const fallback = this.cfg.strategy?.fallback ?? [];
    return ['fs', ...fallback].filter((v, i, a) => a.indexOf(v) === i) as StorageProvider[];
  }

  async save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>> {
    // Day 1: if multi, pick a provider based on simple rules; otherwise use configured provider
    const isMulti = this.cfg.provider === 'multi';
    let preferred: StorageProvider | undefined = undefined;
    if (isMulti) {
      if (mimetype.startsWith('image/')) preferred = 's3';
      else if (mimetype.startsWith('text/')) preferred = 'gcs';
      else preferred = 'fs';
    }

    const order = isMulti ? [preferred!, ...this.providersInOrder().filter(p => p !== preferred)] : this.providersInOrder();
    const errors: Error[] = [];
    let attempt = 0;

    const work = async (): Promise<AppResult<SavedFileInfo>> => {
      for (const p of order) {
        const adapter = this.pickAdapter(p);
        if (!adapter) continue;
        attempt++;
        try {
          const res = await this.withTimeout(adapter.save(fileStream, originalFilename, mimetype), this.cfg.timeoutMs.save);
          return res;
        } catch (e) {
          errors.push(e instanceof Error ? e : new Error(String(e)));
        }
      }
      return AppResult.Err(AppError.Generic(`All storage providers failed: ${errors.map(e => e.message).join('; ')}`));
    };

    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/StorageStrategy:save', true, async () => {
        this.obs!.addCustomAttributes({ preferred, isMulti, mimetype, filename: originalFilename });
        try {
          const result = await work();
          this.obs!.addCustomAttributes({ attempts: attempt, success: !result.isErr() });
          return result;
        } catch (err) {
          this.obs!.noticeError(err as Error, { attempts: attempt });
          throw err;
        }
      });
    }

    return await work();
  }

  async remove(path: string): Promise<AppResult<boolean>> {
    const order = this.providersInOrder();
    const errors: Error[] = [];
    let attempt = 0;

    const work = async (): Promise<AppResult<boolean>> => {
      for (const p of order) {
        const adapter = this.pickAdapter(p);
        if (!adapter) continue;
        attempt++;
        try {
          const res = await this.withTimeout(
            adapter.remove(path),
            this.cfg.timeoutMs.remove
          );
          return res;
        } catch (e) {
          errors.push(e instanceof Error ? e : new Error(String(e)));
        }
      }
      return AppResult.Err(AppError.Generic(`All storage providers failed: ${errors.map(e => e.message).join('; ')}`));
    };

    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/StorageStrategy:remove', true, async () => {
        this.obs!.addCustomAttributes({ path });
        try {
          const result = await work();
          this.obs!.addCustomAttributes({ attempts: attempt, success: !result.isErr() });
          return result;
        } catch (err) {
          this.obs!.noticeError(err as Error, { attempts: attempt });
          throw err;
        }
      });
    }

    return await work();
  }

  async getPresignedDownloadUrl(path: string, expiresSeconds: number) {
    const adapter = this.pickByPath(path);
    const exec = async () => {
      if (adapter && adapter.getPresignedDownloadUrl) {
        return adapter.getPresignedDownloadUrl(path, expiresSeconds);
      }
      return AppResult.Err(AppError.Generic('Presign not supported for this provider'));
    };

    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/StorageStrategy:getPresignedDownloadUrl', true, async () => {
        this.obs!.addCustomAttributes({ path, expiresSeconds });
        try { return await exec(); }
        catch (err) { this.obs!.noticeError(err as Error); throw err; }
      });
    }
    return await exec();
  }

  async readStream(path: string) {
    const adapter = this.pickByPath(path);
    const exec = async () => {
      if (adapter && adapter.readStream) {
        return adapter.readStream(path);
      }
      return AppResult.Err(AppError.Generic('Read stream not supported for this provider'));
    };

    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/StorageStrategy:readStream', true, async () => {
        this.obs!.addCustomAttributes({ path });
        try { return await exec(); }
        catch (err) { this.obs!.noticeError(err as Error); throw err; }
      });
    }
    return await exec();
  }
}

