import { inject, injectable } from 'tsyringe';
import { AppResult, AppError } from '@carbonteq/hexapp';
import type { FileStoragePort, SavedFileInfo } from '../../application/ports/FileStoragePort.js';
import type { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';
import type { ILogger } from '../../shared/interfaces/ILogger.js';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
import type { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

@injectable()
export class S3StorageAdapter implements FileStoragePort {
  constructor(
    @inject('IConfigurationService') private readonly config: IConfigurationService,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  private ensureConfig(): { bucket: string; region: string; prefix?: string } | AppError {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    // Access keys can be provided via env or IAM role; we don't hard-require here
    if (!bucket) return AppError.Generic('S3_BUCKET is required for S3 storage');
    if (!region) return AppError.Generic('AWS_REGION is required for S3 storage');
    return { bucket, region, prefix: process.env.S3_PREFIX };
  }

  private async getClient(): Promise<S3Client> {
    // Dynamic import to avoid hard dependency when S3 is unused
    const sdk: typeof import('@aws-sdk/client-s3') = await import('@aws-sdk/client-s3');
    const { S3Client } = sdk;
    const cfg = this.ensureConfig();
    if (cfg instanceof AppError) throw cfg;
    const endpoint = process.env.S3_ENDPOINT; // e.g., http://localhost:9000 for MinIO
    const forcePathStyle = String(process.env.S3_FORCE_PATH_STYLE || '').toLowerCase() === 'true';
    const client = new S3Client({
      region: cfg.region,
      ...(endpoint ? { endpoint } : {}),
      ...(endpoint ? { forcePathStyle } : {}),
    });
    return client;
  }

  private buildKey(originalFilename: string): string {
    const ext = path.extname(originalFilename) || '';
    const stamp = Date.now();
    const rnd = crypto.randomBytes(8).toString('hex');
    const base = `${stamp}-${rnd}${ext}`;
    const prefix = process.env.S3_PREFIX ? process.env.S3_PREFIX.replace(/\/$/, '') + '/' : '';
    return `${prefix}${base}`;
  }

  async save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>> {
    const work = async (): Promise<AppResult<SavedFileInfo>> => {
      try {
      const cfg = this.ensureConfig();
      if (cfg instanceof AppError) return AppResult.Err(cfg);
      const client = await this.getClient();
      const mod: typeof import('@aws-sdk/client-s3') = await import('@aws-sdk/client-s3');
      const { PutObjectCommand } = mod;

      const key = this.buildKey(originalFilename);

      // Create a buffer to store the file content for size calculation
      const chunks: Buffer[] = [];
      let size = 0;
      
      // Collect chunks and calculate size
      fileStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        size += chunk.length;
      });

      // Wait for the stream to end
      await new Promise<void>((resolve, reject) => {
        fileStream.on('end', () => resolve());
        fileStream.on('error', reject);
      });

      // Create a new readable stream from the collected chunks
      const bufferStream = Readable.from(Buffer.concat(chunks));

      const controller = new AbortController();
      const timeoutMs = Number(process.env.S3_TIMEOUT_MS || 30000);
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      await client.send(new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: Buffer.concat(chunks),
        ContentType: mimetype,
        ContentLength: size,
      }), { abortSignal: controller.signal }).finally(() => clearTimeout(timer));

      const info: SavedFileInfo = {
        path: `s3://${cfg.bucket}/${key}`,
        filename: originalFilename,
        mimetype,
        size,
        storageProvider: 's3',
        externalKey: key,
      };
      return AppResult.Ok(info);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('S3 save failed');
      this.logger.error('S3 save failed', error);
      this.obs?.noticeError(error, { storageProvider: 's3', op: 'save' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/S3Adapter:save', true, async () => {
        try { this.obs!.addCustomAttributes({ storageProvider: 's3', filename: originalFilename, mimetype }); } catch {}
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
      const mod: typeof import('@aws-sdk/client-s3') = await import('@aws-sdk/client-s3');
      const { DeleteObjectCommand } = mod;

      // Accept either full s3://bucket/key or just key
      const key = objectPathOrKey.startsWith('s3://')
        ? objectPathOrKey.replace(/^s3:\/\/[a-zA-Z0-9._-]+\//, '')
        : objectPathOrKey;

      const controller = new AbortController();
      const timeoutMs = Number(process.env.S3_TIMEOUT_MS || 30000);
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }), { abortSignal: controller.signal }).finally(() => clearTimeout(timer));
      return AppResult.Ok(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('S3 remove failed');
      this.logger.error('S3 remove failed', error);
      this.obs?.noticeError(error, { storageProvider: 's3', op: 'remove' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/S3Adapter:remove', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 's3', objectPathOrKey });
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
      const mod: typeof import('@aws-sdk/client-s3') = await import('@aws-sdk/client-s3');
      const { GetObjectCommand } = mod;
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const key = pathOrKey.startsWith('s3://')
        ? pathOrKey.replace(/^s3:\/\/[a-zA-Z0-9._-]+\//, '')
        : pathOrKey;

      const command = new GetObjectCommand({ Bucket: cfg.bucket, Key: key });
      const url = await getSignedUrl(client, command, { expiresIn: expiresSeconds });
      const expiresAt = new Date(Date.now() + expiresSeconds * 1000);
      return AppResult.Ok({ url, expiresAt });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('S3 presign failed');
      this.logger.error('S3 presign failed', error);
      this.obs?.noticeError(error, { storageProvider: 's3', op: 'presign' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/S3Adapter:getPresignedDownloadUrl', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 's3', pathOrKey, expiresSeconds });
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
      const mod: typeof import('@aws-sdk/client-s3') = await import('@aws-sdk/client-s3');
      const { GetObjectCommand } = mod;

      const key = pathOrKey.startsWith('s3://')
        ? pathOrKey.replace(/^s3:\/\/[a-zA-Z0-9._-]+\//, '')
        : pathOrKey;

      const controller = new AbortController();
      const timeoutMs = Number(process.env.S3_TIMEOUT_MS || 30000);
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }), { abortSignal: controller.signal }).finally(() => clearTimeout(timer));
      const body = res?.Body as NodeJS.ReadableStream | undefined;
      if (!body) return AppResult.Err(AppError.Generic('S3 read returned empty body'));
      return AppResult.Ok(body);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('S3 read failed');
      this.logger.error('S3 readStream failed', error);
      this.obs?.noticeError(error, { storageProvider: 's3', op: 'read' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/S3Adapter:readStream', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 's3', pathOrKey });
        return await work();
      });
    }
    return await work();
  }
}

