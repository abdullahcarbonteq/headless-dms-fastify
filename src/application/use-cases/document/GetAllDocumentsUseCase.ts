import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated } from '@carbonteq/hexapp';
import type { SearchDocumentsOutputItem} from '../../dto/document/SearchDocumentsDTO.js';

@injectable()
export class GetAllDocumentsUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input?: { page?: number; limit?: number }): Promise<AppResult<SearchDocumentsOutputItem[] | HexPaginated<SearchDocumentsOutputItem>>> {
    this.logger.info('UseCase: GetAllDocuments - start', { input });
    const pagination: HexPaginationOptions | undefined = 
    typeof input?.page === 'number' && typeof input?.limit === 'number' 
    && input.page > 0 && input.limit > 0 
    && input.limit <= 100
      ? HexPaginationOptions.create({ pageNum: input.page, pageSize: input.limit }).unwrap()
      : undefined;

    const res = await this.docRepo.getAllDocuments(pagination);
    if (res.isErr()) return AppResult.Err(AppError.Generic('Failed to get documents'));
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
      return AppResult.Ok(items);
    } else {
      const p = val as HexPaginated<any>;
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
    }
  }
}

