import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { UserRepositoryPort } from '../../ports/UserRepositoryPort.js';
import { PaginationOptions as HexPaginationOptions, Paginated as HexPaginated } from '@carbonteq/hexapp';
import type { RegisterUserOutput } from '../../dto/user/RegisterUserDTO.js';

@injectable()
export class GetAllUsersUseCase {
  constructor(
    @inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input?: { page?: number; limit?: number }): Promise<AppResult<RegisterUserOutput[] | HexPaginated<RegisterUserOutput>>> {
    this.logger.info('UseCase: GetAllUsers - start', { input });
    const pagination: HexPaginationOptions | undefined = 
    typeof input?.page === 'number' && typeof input?.limit === 'number' 
    && input.page > 0 && input.limit > 0 
    && input.limit <= 100
      ? HexPaginationOptions.create({ pageNum: input.page, pageSize: input.limit }).unwrap() 
      : undefined;

    const res = await this.userRepo.getAllUsers(pagination);
    if (res.isErr()) return AppResult.Err(AppError.Generic('Failed to get users'));
    const val = res.unwrap();
    if (Array.isArray(val)) {
      const users: RegisterUserOutput[] = val.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
      return AppResult.Ok(users);
    } else {
      const p = val as HexPaginated<any>;
      const users: RegisterUserOutput[] = p.data.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
      return AppResult.Ok({ data: users, pageNum: p.pageNum, pageSize: p.pageSize, totalPages: p.totalPages });
    }
  }
}

