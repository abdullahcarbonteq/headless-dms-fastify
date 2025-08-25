import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { FileStoragePort } from '../../ports/FileStoragePort.js';
import type { IObservabilityService } from '../../../shared/interfaces/IObservabilityService.js';

export interface DeleteDocumentInput { id: string; }

@injectable()
export class DeleteDocumentUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('FileStoragePort') private readonly storage?: FileStoragePort,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  async execute(input: DeleteDocumentInput): Promise<AppResult<boolean>> {
    const run = async (): Promise<AppResult<boolean>> => {
      this.logger.info('UseCase: DeleteDocument - start', { id: input.id });
      const docRes = await this.docRepo.findById(input.id);
      if (docRes.isErr()) return AppResult.Err(AppError.Generic('Failed to find document'));
      const doc = docRes.unwrap();

      const res = await this.docRepo.deleteDocument(input.id);
      if (res.isErr()) return AppResult.Err(AppError.Generic('Failed to delete document'));

      if (this.storage && doc?.path) {
        try { await this.storage.remove(doc.path); } catch (e) { /* best-effort */ }
      }
      return AppResult.Ok(res.unwrap());
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/UseCase:DeleteDocument', true, async () => {
        this.obs!.addCustomAttributes({ id: input.id });
        try { return await run(); } catch (e) { this.obs!.noticeError(e as Error); throw e; }
      });
    }
    return await run();
  }
}

