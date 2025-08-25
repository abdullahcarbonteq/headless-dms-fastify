import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { Document } from '../../../domain/entities/document/Document.js';
import type { IObservabilityService } from '../../../shared/interfaces/IObservabilityService.js';

@injectable()
export class GetDocumentByIdUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  async execute(id: string): Promise<AppResult<Document | null>> {
    const run = async (): Promise<AppResult<Document | null>> => {
      this.logger.info('UseCase: GetDocumentById - start', { id });
      const result = await this.docRepo.findById(id);
      if (result.isErr()) {
        return AppResult.Err(AppError.Generic('Failed to get document'));
      }
      return AppResult.Ok(result.unwrap());
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/UseCase:GetDocumentById', true, async () => run());
    }
    return await run();
  }
}

