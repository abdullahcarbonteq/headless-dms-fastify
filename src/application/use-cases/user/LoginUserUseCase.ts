import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { LoginUserInput, LoginUserOutput } from '../../dto/user/LoginUserDTO.js';
import type { UserRepositoryPort } from '../../ports/UserRepositoryPort.js';
import type { AuthPort } from '../../ports/AuthPort.js';

@injectable()
export class LoginUserUseCase {
  constructor(
    @inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @inject('AuthPort') private readonly auth: AuthPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: LoginUserInput): Promise<Result<LoginUserOutput, Error>> {
    this.logger.info('UseCase: LoginUser - start', { email: input.email });

    const userRes = await this.userRepo.findByEmail(input.email);
    if (userRes.isErr()) return Result.Err(new Error('Failed to find user'));
    const user = userRes.unwrap();
    if (!user) return Result.Err(new Error('Invalid email'));

    const cmp = await this.auth.comparePassword(input.password, user.passwordHash);
    if (cmp.isErr()) return Result.Err(new Error('Failed to verify password'));
    if (!cmp.unwrap()) return Result.Err(new Error('The Password you entered is incorrect'));

    const tokenRes = await this.auth.generateToken(user);
    if (tokenRes.isErr()) return Result.Err(new Error('Failed to generate authentication token'));

    this.logger.info('UseCase: LoginUser - success', { userId: user.id });
    return Result.Ok({ token: tokenRes.unwrap() });
  }
}

