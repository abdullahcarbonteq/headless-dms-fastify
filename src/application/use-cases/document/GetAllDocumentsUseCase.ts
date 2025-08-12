import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { PaginationOptions } from '../../../shared/dto/pagination.dto.js';
import type { SearchDocumentsOutputItem, PaginatedSearchDocumentsOutput } from '../../dto/document/SearchDocumentsDTO.js';

@injectable()
export class GetAllDocumentsUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input?: { page?: number; limit?: number }): Promise<Result<SearchDocumentsOutputItem[] | PaginatedSearchDocumentsOutput, Error>> {
    this.logger.info('UseCase: GetAllDocuments - start', { input });
    const pagination: PaginationOptions | undefined = input?.page && input?.limit
      ? { page: input.page, limit: input.limit }
      : undefined;

    const res = await this.docRepo.getAllDocuments(pagination);
    if (res.isErr()) return Result.Err(new Error('Failed to get documents'));
    const val = res.unwrap();
    if (Array.isArray(val)) {
      const items: SearchDocumentsOutputItem[] = val.map(d => ({
        id: d.id,
        filename: d.filename,
        mimetype: d.mimetype,
        path: d.path,
        tags: d.tags,
        description: d.description,
        userId: d.userId,
      }));
      return Result.Ok(items);
    } else {
      const items: SearchDocumentsOutputItem[] = val.data.map(d => ({
        id: d.id,
        filename: d.filename,
        mimetype: d.mimetype,
        path: d.path,
        tags: d.tags,
        description: d.description,
        userId: d.userId,
      }));
      return Result.Ok({ data: items, total: val.total, page: val.page, limit: val.limit, totalPages: val.totalPages });
    }
  }
}

