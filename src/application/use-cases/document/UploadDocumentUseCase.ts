import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { UploadDocumentInput, UploadDocumentOutput } from '../../dto/document/UploadDocumentDTO.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import { DocumentFactory } from '../../../domain/entities/document/DocumentFactory.js';

@injectable()
export class UploadDocumentUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: UploadDocumentInput): Promise<Result<UploadDocumentOutput, Error>> {
    this.logger.info('UseCase: UploadDocument - start', { filename: input.filename });

    const entityRes = DocumentFactory.createDocument({
      filename: input.filename,
      mimetype: input.mimetype,
      path: input.path,
      tags: input.tags || [],
      description: input.description ?? null,
      userId: input.userId,
    });
    if (entityRes.isErr()) return Result.Err(entityRes.unwrapErr());

    const createRes = await this.docRepo.createDocument(entityRes.unwrap());
    if (createRes.isErr()) return Result.Err(new Error('Failed to create document'));

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
    return Result.Ok(out);
  }
}

