import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { DocumentRepositoryPort } from '../../ports/DocumentRepositoryPort.js';
import { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated } from '@carbonteq/hexapp';
import type { Document } from '../../../domain/entities/document/Document.js';
import type { SearchDocumentsOutputItem} from '../../dto/document/SearchDocumentsDTO.js';
import type { IObservabilityService } from '../../../shared/interfaces/IObservabilityService.js';

@injectable()
export class GetAllDocumentsUseCase {
  constructor(
    @inject('DocumentRepositoryPort') private readonly docRepo: DocumentRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
    @inject('IObservabilityService') private readonly obs?: IObservabilityService,
  ) {}

  async execute(input?: { page?: number; limit?: number }): Promise<AppResult<HexPaginated<SearchDocumentsOutputItem>>> {
    const run = async (): Promise<AppResult<HexPaginated<SearchDocumentsOutputItem>>> => {
      this.logger.info('UseCase: GetAllDocuments - start', { input });
    const pagination: HexPaginationOptions | undefined = 
    typeof input?.page === 'number' && typeof input?.limit === 'number' 
    && input.page > 0 && input.limit > 0 
    && input.limit <= 100
      ? HexPaginationOptions.create({ pageNum: input.page, pageSize: input.limit }).unwrap()
      : undefined;

    const res = await this.docRepo.getAllDocuments(pagination);
    if (res.isErr()) return AppResult.Err(AppError.Generic('Failed to get documents'));
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
      return await this.obs.startSegment('Custom/UseCase:GetAllDocuments', true, async () => run());
    }
    return await run();
  }
}

