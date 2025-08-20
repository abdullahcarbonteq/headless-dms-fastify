import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { Document } from '../../../domain/entities/document/Document.js';

@injectable()
export class GetDocumentByIdUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(id: string): Promise<AppResult<Document | null>> {
    this.logger.info('UseCase: GetDocumentById - start', { id });
    const result = await this.docRepo.findById(id);
    if (result.isErr()) {
      return AppResult.Err(AppError.Generic('Failed to get document'));
    }
    return AppResult.Ok(result.unwrap());
  }
}

