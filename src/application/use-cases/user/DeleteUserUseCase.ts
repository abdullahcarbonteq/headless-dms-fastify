import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { UserRepositoryPort } from '../../ports/UserRepositoryPort.js';

export interface DeleteUserInput { id: string; }

@injectable()
export class DeleteUserUseCase {
  constructor(
    @inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: DeleteUserInput): Promise<AppResult<boolean>> {
    this.logger.info('UseCase: DeleteUser - start', { id: input.id });
    const res = await this.userRepo.deleteUser(input.id);
    if (res.isErr()) return AppResult.Err(AppError.Generic('Failed to delete user'));
    return AppResult.Ok(res.unwrap());
  }
}

