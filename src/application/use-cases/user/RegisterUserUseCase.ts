import { inject, injectable } from 'tsyringe';
import { AppResult, AppError, AppErrStatus } from '@carbonteq/hexapp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { RegisterUserInput, RegisterUserOutput } from '../../dto/user/RegisterUserDTO.js';
import type { UserRepositoryPort } from '../../ports/UserRepositoryPort.js';
import type { AuthPort } from '../../ports/AuthPort.js';
import { UserFactory } from '../../../domain/entities/user/UserFactory.js';

@injectable()
export class RegisterUserUseCase {
  constructor(
    @inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @inject('AuthPort') private readonly auth: AuthPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: RegisterUserInput): Promise<AppResult<RegisterUserOutput>> {
    this.logger.info('UseCase: RegisterUser - start', { email: input.email });

    const hashRes = await this.auth.hashPassword(input.password);
    if (hashRes.isErr()) {
      return AppResult.Err(AppError.Generic('Failed to hash password'));
    }

    const entityRes = UserFactory.createUser({
      name: input.name,
      email: input.email,
      passwordHash: hashRes.unwrap(),
      role: input.role,
    });
    if (entityRes.isErr()) {
      return AppResult.Err(AppError.InvalidData(entityRes.unwrapErr().message));
    }

    const createRes = await this.userRepo.createUser(entityRes.unwrap());
    if (createRes.isErr()) {
      return AppResult.Err(AppError.Generic('Failed to create user'));
    }

    const u = createRes.unwrap();
    const out: RegisterUserOutput = { id: u.id, name: u.name, email: u.email, role: u.role };
    this.logger.info('UseCase: RegisterUser - success', { userId: u.id });
    return AppResult.Ok(out);
  }
}

