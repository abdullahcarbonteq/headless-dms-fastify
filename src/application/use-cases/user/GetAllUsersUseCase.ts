import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { UserRepositoryPort } from '../../ports/UserRepositoryPort.js';
import type { PaginationOptions, PaginatedResult } from '../../../shared/dto/pagination.dto.js';
import type { RegisterUserOutput } from '../../dto/user/RegisterUserDTO.js';

@injectable()
export class GetAllUsersUseCase {
  constructor(
    @inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input?: { page?: number; limit?: number }): Promise<Result<RegisterUserOutput[] | PaginatedResult<RegisterUserOutput>, Error>> {
    this.logger.info('UseCase: GetAllUsers - start', { input });
    const pagination: PaginationOptions | undefined = input?.page && input?.limit
      ? { page: input.page, limit: input.limit }
      : undefined;

    const res = await this.userRepo.getAllUsers(pagination);
    if (res.isErr()) return Result.Err(new Error('Failed to get users'));
    const val = res.unwrap();
    if (Array.isArray(val)) {
      const users: RegisterUserOutput[] = val.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
      return Result.Ok(users);
    } else {
      const users: RegisterUserOutput[] = val.data.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
      return Result.Ok({ ...val, data: users });
    }
  }
}

