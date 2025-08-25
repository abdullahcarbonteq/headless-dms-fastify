import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated } from '@carbonteq/hexapp';
import type { Document } from '../../../domain/entities/document/Document.js';
import type { IObservabilityService } from '../../../shared/interfaces/IObservabilityService.js';
import type {
  SearchDocumentsInput,
  SearchDocumentsOutputItem,
} from '../../dto/document/SearchDocumentsDTO.js';

@injectable()
export class SearchDocumentsUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  async execute(input: SearchDocumentsInput): Promise<AppResult<HexPaginated<SearchDocumentsOutputItem>>> {
    const run = async (): Promise<AppResult<HexPaginated<SearchDocumentsOutputItem>>> => {
      this.logger.info('UseCase: SearchDocuments - start', { input });

    const pagination: HexPaginationOptions | undefined = 
    typeof input.page === 'number' && typeof input.limit === 'number' 
    && input.page > 0 && input.limit > 0 
    && input.limit <= 100
      ? HexPaginationOptions.create({ pageNum: input.page, pageSize: input.limit }).unwrap()
      : undefined;

    const criteria = { tags: input.tags, description: input.description, userId: input.userId };
    const res = await this.docRepo.searchDocuments(criteria, pagination);
    if (res.isErr()) return AppResult.Err(AppError.Generic('Failed to search documents'));

    const p = res.unwrap() as HexPaginated<Document>;
    const items: SearchDocumentsOutputItem[] = p.data.map(d => ({
      id: d.id,
      filename: d.filename,
      mimetype: d.mimetype,
      path: d.path,
      tags: d.tags,
      description: d.description,
      userId: d.userId,
    }));
    return AppResult.Ok({ data: items, pageNum: p.pageNum, pageSize: p.pageSize, totalPages: p.totalPages });
    };
    if (this.obs && this.obs.isEnabled()) {
      return await this.obs.startSegment('Custom/UseCase:SearchDocuments', true, async () => run());
    }
    return await run();
  }
}

