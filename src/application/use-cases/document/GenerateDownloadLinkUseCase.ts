import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { AuthPort } from '../../ports/AuthPort.js';
import type { GenerateDownloadLinkInput, GenerateDownloadLinkOutput } from '../../dto/document/GenerateDownloadLinkDTO.js';

@injectable()
export class GenerateDownloadLinkUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('AuthPort') private readonly auth: AuthPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: GenerateDownloadLinkInput): Promise<Result<GenerateDownloadLinkOutput, Error>> {
    this.logger.info('UseCase: GenerateDownloadLink - start', { id: input.id });

    const docRes = await this.docRepo.findById(input.id);
    if (docRes.isErr()) return Result.Err(new Error('Failed to load document'));
    const doc = docRes.unwrap();
    if (!doc) return Result.Err(new Error('Document not found'));

    const tokenRes = await this.auth.generateDownloadToken({ docId: input.id });
    if (tokenRes.isErr()) return Result.Err(new Error('Failed to generate token'));

    return Result.Ok({ url: `/api/documents/download/${tokenRes.unwrap()}` });
  }
}

