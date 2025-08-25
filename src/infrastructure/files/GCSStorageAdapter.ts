import { inject, injectable } from 'tsyringe';
import { AppResult, AppError } from '@carbonteq/hexapp';
import type { FileStoragePort, SavedFileInfo } from '../../application/ports/FileStoragePort.js';
import type { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';
import type { ILogger } from '../../shared/interfaces/ILogger.js';
import crypto from 'crypto';
import path from 'path';
import type { Storage } from '@google-cloud/storage';

@injectable()
export class GCSStorageAdapter implements FileStoragePort {
  constructor(
    @inject('IConfigurationService') private readonly config: IConfigurationService,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  private ensureConfig(): { bucket: string; prefix?: string } | AppError {
    const bucket = process.env.GCS_BUCKET;
    if (!bucket) return AppError.Generic('GCS_BUCKET is required for GCS storage');
    return { bucket, prefix: process.env.GCS_PREFIX };
  }

  private async getClient(): Promise<Storage> {
    // Dynamic import to avoid hard dependency when GCS is unused
    const mod: typeof import('@google-cloud/storage') = await import('@google-cloud/storage');
    const { Storage } = mod;

    const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const emulatorHost = process.env.STORAGE_EMULATOR_HOST || process.env.GCS_EMULATOR_HOST; // e.g., http://localhost:4443
    const projectId = process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || 'dev';

    const client = new Storage({
      projectId,
      ...(keyFilename ? { keyFilename } : {}),
      ...(emulatorHost ? { apiEndpoint: emulatorHost } : {}),
    });
    return client;
  }

  private buildKey(originalFilename: string): string {
    const ext = path.extname(originalFilename) || '';
    const stamp = Date.now();
    const rnd = crypto.randomBytes(8).toString('hex');
    const base = `${stamp}-${rnd}${ext}`;
    const prefix = process.env.GCS_PREFIX ? process.env.GCS_PREFIX.replace(/\/$/, '') + '/' : '';
    return `${prefix}${base}`;
  }

  async save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>> {
    const work = async (): Promise<AppResult<SavedFileInfo>> => {
      try {
      const cfg = this.ensureConfig();
      if (cfg instanceof AppError) return AppResult.Err(cfg);
      const client = await this.getClient();
      const bucket = client.bucket(cfg.bucket);

      const key = this.buildKey(originalFilename);

      // Buffer the stream for simplicity and to know Content-Length
      const chunks: Buffer[] = [];
      let size = 0;
      fileStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        size += chunk.length;
      });

      await new Promise<void>((resolve, reject) => {
        fileStream.on('end', () => resolve());
        fileStream.on('error', reject);
      });

      const file = bucket.file(key);
      await file.save(Buffer.concat(chunks), { contentType: mimetype, resumable: false });

      const info: SavedFileInfo = {
        path: `gcs://${cfg.bucket}/${key}`,
        filename: originalFilename,
        mimetype,
        size,
        storageProvider: 'gcs',
        externalKey: key,
      };
      return AppResult.Ok(info);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('GCS save failed');
      this.logger.error('GCS save failed', error);
      this.obs?.noticeError(error, { storageProvider: 'gcs', op: 'save' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/GCSAdapter:save', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'gcs', filename: originalFilename, mimetype });
        return await work();
      });
    }
    return await work();
  }

  async remove(objectPathOrKey: string): Promise<AppResult<boolean>> {
    const work = async (): Promise<AppResult<boolean>> => {
      try {
      const cfg = this.ensureConfig();
      if (cfg instanceof AppError) return AppResult.Err(cfg);
      const client = await this.getClient();
      const bucket = client.bucket(cfg.bucket);

      const key = objectPathOrKey.startsWith('gcs://')
        ? objectPathOrKey.replace(/^gcs:\/\/[a-zA-Z0-9._-]+\//, '')
        : objectPathOrKey;

      await bucket.file(key).delete({ ignoreNotFound: true });
      return AppResult.Ok(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('GCS remove failed');
      this.logger.error('GCS remove failed', error);
      this.obs?.noticeError(error, { storageProvider: 'gcs', op: 'remove' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/GCSAdapter:remove', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'gcs', objectPathOrKey });
        return await work();
      });
    }
    return await work();
  }

  async getPresignedDownloadUrl(pathOrKey: string, expiresSeconds: number): Promise<AppResult<{ url: string; expiresAt: Date }>> {
    const work = async (): Promise<AppResult<{ url: string; expiresAt: Date }>> => {
      try {
      const cfg = this.ensureConfig();
      if (cfg instanceof AppError) return AppResult.Err(cfg);
      const client = await this.getClient();
      const bucket = client.bucket(cfg.bucket);

      const key = pathOrKey.startsWith('gcs://')
        ? pathOrKey.replace(/^gcs:\/\/[a-zA-Z0-9._-]+\//, '')
        : pathOrKey;

      const file = bucket.file(key);

      // Emulator often lacks signing; if emulator host is set, try direct media URL
      const emulatorHost = process.env.STORAGE_EMULATOR_HOST || process.env.GCS_EMULATOR_HOST;
      if (emulatorHost) {
        const base = emulatorHost.replace(/\/$/, '');
        const url = `${base}/storage/v1/b/${encodeURIComponent(cfg.bucket)}/o/${encodeURIComponent(key)}?alt=media`;
        const expiresAt = new Date(Date.now() + expiresSeconds * 1000);
        return AppResult.Ok({ url, expiresAt });
      }

      const expiresAt = new Date(Date.now() + expiresSeconds * 1000);
      const [url] = await file.getSignedUrl({ action: 'read', expires: expiresAt });
      return AppResult.Ok({ url, expiresAt });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('GCS presign failed');
      this.obs?.noticeError(error, { storageProvider: 'gcs', op: 'presign' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/GCSAdapter:getPresignedDownloadUrl', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'gcs', pathOrKey, expiresSeconds });
        return await work();
      });
    }
    return await work();
  }

  async readStream(pathOrKey: string): Promise<AppResult<NodeJS.ReadableStream>> {
    const work = async (): Promise<AppResult<NodeJS.ReadableStream>> => {
      try {
      const cfg = this.ensureConfig();
      if (cfg instanceof AppError) return AppResult.Err(cfg);
      const client = await this.getClient();
      const bucket = client.bucket(cfg.bucket);
      const key = pathOrKey.startsWith('gcs://')
        ? pathOrKey.replace(/^gcs:\/\/[a-zA-Z0-9._-]+\//, '')
        : pathOrKey;
      const file = bucket.file(key);
      return AppResult.Ok(file.createReadStream());
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('GCS read failed');
      this.obs?.noticeError(error, { storageProvider: 'gcs', op: 'read' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/GCSAdapter:readStream', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'gcs', pathOrKey });
        return await work();
      });
    }
    return await work();
  }
}

