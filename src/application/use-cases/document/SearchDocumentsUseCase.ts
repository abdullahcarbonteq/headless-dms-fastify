import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import type { PaginationOptions } from '../../../shared/dto/pagination.dto.js';
import type {
  SearchDocumentsInput,
  PaginatedSearchDocumentsOutput,
  SearchDocumentsOutputItem,
} from '../../dto/document/SearchDocumentsDTO.js';

@injectable()
export class SearchDocumentsUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: SearchDocumentsInput): Promise<Result<PaginatedSearchDocumentsOutput | SearchDocumentsOutputItem[], Error>> {
    this.logger.info('UseCase: SearchDocuments - start', { input });

    const pagination: PaginationOptions | undefined = input.page && input.limit
      ? { page: input.page, limit: input.limit }
      : undefined;

    const criteria = { tags: input.tags, description: input.description, userId: input.userId };
    const res = await this.docRepo.searchDocuments(criteria, pagination);
    if (res.isErr()) return Result.Err(new Error('Failed to search documents'));

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

