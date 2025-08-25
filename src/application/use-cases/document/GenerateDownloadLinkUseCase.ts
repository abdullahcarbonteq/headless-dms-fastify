import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { AuthPort } from '../../ports/AuthPort.js';
import type { GenerateDownloadLinkInput, GenerateDownloadLinkOutput } from '../../dto/document/GenerateDownloadLinkDTO.js';
import type { IObservabilityService } from '../../../shared/interfaces/IObservabilityService.js';

@injectable()
export class GenerateDownloadLinkUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('AuthPort') private readonly auth: AuthPort,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  async execute(input: GenerateDownloadLinkInput): Promise<AppResult<GenerateDownloadLinkOutput>> {
    const run = async (): Promise<AppResult<GenerateDownloadLinkOutput>> => {
      this.logger.info('UseCase: GenerateDownloadLink - start', { id: input.id });
      const docRes = await this.docRepo.findById(input.id);
      if (docRes.isErr()) return AppResult.Err(AppError.Generic('Failed to load document'));
      const doc = docRes.unwrap();
      if (!doc) return AppResult.Err(AppError.NotFound('Document not found'));

      const tokenRes = await this.auth.generateDownloadToken({ docId: input.id });
      if (tokenRes.isErr()) return AppResult.Err(AppError.Generic('Failed to generate token'));

      return AppResult.Ok({ url: `/api/documents/download/${tokenRes.unwrap()}` });
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/UseCase:GenerateDownloadLink', true, async () => run());
    }
    return await run();
  }
}

