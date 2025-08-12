import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { UserRepositoryPort } from '../../ports/UserRepositoryPort.js';

export interface DeleteUserInput { id: string; }

@injectable()
export class DeleteUserUseCase {
  constructor(
    @inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: DeleteUserInput): Promise<Result<boolean, Error>> {
    this.logger.info('UseCase: DeleteUser - start', { id: input.id });
    const res = await this.userRepo.deleteUser(input.id);
    if (res.isErr()) return Result.Err(new Error('Failed to delete user'));
    return Result.Ok(res.unwrap());
  }
}

