import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';

export interface DeleteDocumentInput { id: string; }

@injectable()
export class DeleteDocumentUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: DeleteDocumentInput): Promise<Result<boolean, Error>> {
    this.logger.info('UseCase: DeleteDocument - start', { id: input.id });
    const res = await this.docRepo.deleteDocument(input.id);
    if (res.isErr()) return Result.Err(new Error('Failed to delete document'));
    return Result.Ok(res.unwrap());
  }
}

