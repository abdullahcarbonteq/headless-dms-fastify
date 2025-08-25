import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { UploadDocumentInput, UploadDocumentOutput } from '../../dto/document/UploadDocumentDTO.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import { DocumentFactory } from '../../../domain/entities/document/DocumentFactory.js';
import type { FileStoragePort } from '../../ports/FileStoragePort.js';
import type { IObservabilityService } from '../../../shared/interfaces/IObservabilityService.js';

@injectable()
export class UploadDocumentUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('FileStoragePort') private readonly storage?: FileStoragePort,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  async execute(input: UploadDocumentInput): Promise<AppResult<UploadDocumentOutput>> {
    this.logger.info('UseCase: UploadDocument - start', { filename: input.filename });

    const run = async (): Promise<AppResult<UploadDocumentOutput>> => {
      // Two modes for backward-compatibility with tests:
      // - If storage is available and input has fileStream: save the file, then persist doc
      // - Else: assume caller provided a pre-saved path on the input (legacy tests)
      let finalPath: string;
      if (this.storage && 'fileStream' in input && input.fileStream) {
        const savedRes = await this.storage.save(input.fileStream, input.filename, input.mimetype);
        if (savedRes.isErr()) {
          return AppResult.Err(AppError.Generic('Failed to save file'));
        }
        finalPath = savedRes.unwrap().path;
      } else {
        const maybeWithPath = input as unknown as { path?: string };
        if (!('path' in maybeWithPath) || !maybeWithPath.path) {
          return AppResult.Err(AppError.InvalidData('No storage available and no path provided'));
        }
        finalPath = maybeWithPath.path;
      }

      const entityRes = DocumentFactory.createDocument({
        filename: input.filename,
        mimetype: input.mimetype,
        path: finalPath,
        tags: input.tags || [],
        description: input.description ?? null,
        userId: input.userId,
      });
      if (entityRes.isErr()) {
        // Cleanup saved file if entity invalid
        if (this.storage && finalPath) {
          await this.storage.remove(finalPath);
        }
        return AppResult.Err(AppError.InvalidData(entityRes.unwrapErr().message));
      }

      const createRes = await this.docRepo.createDocument(entityRes.unwrap());
      if (createRes.isErr()) {
        // Cleanup saved file on DB failure
        if (this.storage && finalPath) {
          await this.storage.remove(finalPath);
        }
        return AppResult.Err(AppError.Generic('Failed to create document'));
      }

      const d = createRes.unwrap();
      const out: UploadDocumentOutput = {
        id: d.id,
        filename: d.filename,
        mimetype: d.mimetype,
        path: d.path,
        tags: d.tags,
        description: d.description,
        userId: d.userId,
      };
      this.logger.info('UseCase: UploadDocument - success', { documentId: d.id });
      return AppResult.Ok(out);
    };

    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('UseCase:UploadDocument', true, async () => {
        this.obs!.addCustomAttributes({ filename: input.filename, mimetype: input.mimetype, userId: input.userId });
        try {
          return await run();
        } catch (e) {
          this.obs!.noticeError(e as Error);
          throw e;
        }
      });
    }

    return await run();
  }
}

