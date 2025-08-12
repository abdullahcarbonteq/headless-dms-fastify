import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { FileStoragePort } from '../../ports/FileStoragePort.js';

export interface DeleteDocumentInput { id: string; }

@injectable()
export class DeleteDocumentUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('FileStoragePort') private readonly storage?: FileStoragePort,
  ) {}

  async execute(input: DeleteDocumentInput): Promise<Result<boolean, Error>> {
    this.logger.info('UseCase: DeleteDocument - start', { id: input.id });
    // Load document to know its path for cleanup
    const docRes = await this.docRepo.findById(input.id);
    if (docRes.isErr()) return Result.Err(docRes.unwrapErr());
    const doc = docRes.unwrap();

    const res = await this.docRepo.deleteDocument(input.id);
    if (res.isErr()) return Result.Err(new Error('Failed to delete document'));

    // Best-effort file deletion
    if (this.storage && doc?.path) {
      await this.storage.remove(doc.path);
    }

    return Result.Ok(res.unwrap());
  }
}

