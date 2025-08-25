import { inject, injectable } from 'tsyringe';
import { AppResult, AppError } from '@carbonteq/hexapp';
import type { FileStoragePort, SavedFileInfo } from '../../application/ports/FileStoragePort.js';
import type { IConfigurationService } from '../../shared/interfaces/IConfigurationService.js';
import type { IObservabilityService } from '../../shared/interfaces/IObservabilityService.js';
import type { ILogger } from '../../shared/interfaces/ILogger.js';
import crypto from 'crypto';
import path from 'path';
import type {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  SASProtocol
} from '@azure/storage-blob';

@injectable()
export class AzureBlobStorageAdapter implements FileStoragePort {
  constructor(
    @inject('IConfigurationService') private readonly config: IConfigurationService,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  private ensureConfig(): { connectionString: string; container: string; prefix?: string } | AppError {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const container = process.env.AZURE_CONTAINER;
    if (!connectionString) return AppError.Generic('AZURE_STORAGE_CONNECTION_STRING is required for Azure Blob storage');
    if (!container) return AppError.Generic('AZURE_CONTAINER is required for Azure Blob storage');
    return { connectionString, container, prefix: process.env.AZURE_PREFIX };
  }

  private async getClient(): Promise<{ containerClient: import('@azure/storage-blob').ContainerClient }> {
    const mod: typeof import('@azure/storage-blob') = await import('@azure/storage-blob');
    const { BlobServiceClient } = mod;
    const cfg = this.ensureConfig();
    if (cfg instanceof AppError) throw cfg;
    const serviceClient = BlobServiceClient.fromConnectionString(cfg.connectionString);
    const containerClient = serviceClient.getContainerClient(cfg.container);
    await containerClient.createIfNotExists();
    return { containerClient };
  }

  private buildKey(originalFilename: string): string {
    const ext = path.extname(originalFilename) || '';
    const stamp = Date.now();
    const rnd = crypto.randomBytes(8).toString('hex');
    const base = `${stamp}-${rnd}${ext}`;
    const prefix = process.env.AZURE_PREFIX ? process.env.AZURE_PREFIX.replace(/\/$/, '') + '/' : '';
    return `${prefix}${base}`;
  }

  async save(fileStream: NodeJS.ReadableStream, originalFilename: string, mimetype: string): Promise<AppResult<SavedFileInfo>> {
    const work = async (): Promise<AppResult<SavedFileInfo>> => {
      try {
      const cfg = this.ensureConfig();
      if (cfg instanceof AppError) return AppResult.Err(cfg);
      const { containerClient } = await this.getClient();

      const key = this.buildKey(originalFilename);

      // Buffer the stream
      const chunks: Buffer[] = [];
      let size = 0;
      fileStream.on('data', (chunk: Buffer) => { chunks.push(chunk); size += chunk.length; });
      await new Promise<void>((resolve, reject) => { fileStream.on('end', resolve); fileStream.on('error', reject); });

      const blockBlob = containerClient.getBlockBlobClient(key);
      await blockBlob.uploadData(Buffer.concat(chunks), { blobHTTPHeaders: { blobContentType: mimetype } });

      const info: SavedFileInfo = { path: `azure://${cfg.container}/${key}`, filename: originalFilename, mimetype, size, storageProvider: 'azure', externalKey: key };
      return AppResult.Ok(info);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Azure save failed');
      this.logger.error('Azure save failed', error);
      this.obs?.noticeError(error, { storageProvider: 'azure', op: 'save' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/AzureAdapter:save', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'azure', filename: originalFilename, mimetype });
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
      const { containerClient } = await this.getClient();

      const key = objectPathOrKey.startsWith('azure://')
        ? objectPathOrKey.replace(/^azure:\/\/[a-zA-Z0-9._-]+\//, '')
        : objectPathOrKey;

      const blockBlob = containerClient.getBlockBlobClient(key);
      await blockBlob.deleteIfExists();
      return AppResult.Ok(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Azure remove failed');
      this.logger.error('Azure remove failed', error);
      this.obs?.noticeError(error, { storageProvider: 'azure', op: 'remove' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/AzureAdapter:remove', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'azure', objectPathOrKey });
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
      const mod: typeof import('@azure/storage-blob') = await import('@azure/storage-blob');
      const { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, StorageSharedKeyCredential } = mod;

      // When using connection string, parse account name/key for SAS; if not available, fall back to read stream
      const match = /AccountName=([^;]+);AccountKey=([^;]+)/.exec(process.env.AZURE_STORAGE_CONNECTION_STRING || '');
      if (!match) return AppResult.Err(AppError.Generic('Azure SAS requires AccountName and AccountKey'));
      const accountName = match[1];
      const accountKey = match[2];

      const key = pathOrKey.startsWith('azure://')
        ? pathOrKey.replace(/^azure:\/\/[a-zA-Z0-9._-]+\//, '')
        : pathOrKey;

      const { container } = cfg;
      const sharedKey = new StorageSharedKeyCredential(accountName, accountKey);
      const startsOn = new Date();
      const expiresOn = new Date(startsOn.getTime() + expiresSeconds * 1000);
      const sas = generateBlobSASQueryParameters({
        containerName: container,
        blobName: key,
        permissions: BlobSASPermissions.parse('r'),
        startsOn,
        expiresOn,
        protocol: SASProtocol.HttpsAndHttp,
      }, sharedKey).toString();

      // Build blob URL using connection string endpoint or default emulator endpoint
      const { BlobServiceClient: BSC } = mod;
      const serviceClient = BSC.fromConnectionString(cfg.connectionString);
      const containerClient = serviceClient.getContainerClient(container);
      const blobClient = containerClient.getBlobClient(key);
      const url = `${blobClient.url}?${sas}`;
      return AppResult.Ok({ url, expiresAt: expiresOn });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Azure presign failed');
      this.obs?.noticeError(error, { storageProvider: 'azure', op: 'presign' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/AzureAdapter:getPresignedDownloadUrl', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'azure', pathOrKey, expiresSeconds });
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
      const { containerClient } = await this.getClient();
      const key = pathOrKey.startsWith('azure://')
        ? pathOrKey.replace(/^azure:\/\/[a-zA-Z0-9._-]+\//, '')
        : pathOrKey;
      const blob = containerClient.getBlobClient(key);
      const res = await blob.download();
      const stream = res.readableStreamBody as NodeJS.ReadableStream | null;
      if (!stream) return AppResult.Err(AppError.Generic('Azure read returned empty body'));
      return AppResult.Ok(stream);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Azure read failed');
      this.obs?.noticeError(error, { storageProvider: 'azure', op: 'read' });
      return AppResult.Err(AppError.Generic(error.message));
    }
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/AzureAdapter:readStream', true, async () => {
        this.obs!.addCustomAttributes({ storageProvider: 'azure', pathOrKey });
        return await work();
      });
    }
    return await work();
  }
}

