import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { UpdateDocumentMetadataInput, UpdateDocumentMetadataOutput } from '../../dto/document/UpdateMetadataDTO.js';

@injectable()
export class UpdateDocumentMetadataUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: UpdateDocumentMetadataInput): Promise<Result<UpdateDocumentMetadataOutput, Error>> {
    this.logger.info('UseCase: UpdateDocumentMetadata - start', { id: input.id });

    const docRes = await this.docRepo.findById(input.id);
    if (docRes.isErr()) return Result.Err(new Error('Failed to load document'));
    const doc = docRes.unwrap();
    if (!doc) return Result.Err(new Error('Document not found'));

    let updated = doc;
    if (input.tags) {
      const r = updated.replaceTags(input.tags);
      if (r.isErr()) return Result.Err(r.unwrapErr());
      updated = r.unwrap();
    }
    if (input.description !== undefined) {
      const r = updated.updateDescription(input.description ?? null);
      if (r.isErr()) return Result.Err(r.unwrapErr());
      updated = r.unwrap();
    }

    const save = await this.docRepo.updateDocument(updated);
    if (save.isErr()) return Result.Err(new Error('Failed to update document'));

    const d = save.unwrap();
    return Result.Ok({ id: d.id, tags: d.tags, description: d.description });
  }
}

