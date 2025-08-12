import { inject, injectable } from 'tsyringe';
import { Result } from '@carbonteq/fp';
import type { ILogger } from '../../../shared/interfaces/ILogger.js';
import type { UserRepositoryPort } from '../../ports/UserRepositoryPort.js';
import type { AuthPort } from '../../ports/AuthPort.js';

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: 'user' | 'admin';
}

export interface UpdateUserOutput {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

@injectable()
export class UpdateUserUseCase {
  constructor(
    @inject('UserRepositoryPort') private readonly userRepo: UserRepositoryPort,
    @inject('AuthPort') private readonly auth: AuthPort,
    @inject('ILogger') private readonly logger: ILogger,
  ) {}

  async execute(input: UpdateUserInput): Promise<Result<UpdateUserOutput, Error>> {
    this.logger.info('UseCase: UpdateUser - start', { id: input.id, fields: Object.keys(input).filter(k => k !== 'id') });

    const existingRes = await this.userRepo.findById(input.id);
    if (existingRes.isErr()) return Result.Err(new Error('Failed to check existing user'));
    const user = existingRes.unwrap();
    if (!user) return Result.Err(new Error('User not found'));

    let updated = user;
    if (input.name) {
      const r = updated.updateName(input.name);
      if (r.isErr()) return Result.Err(r.unwrapErr());
      updated = r.unwrap();
    }
    if (input.email) {
      const r = updated.updateEmail(input.email);
      if (r.isErr()) return Result.Err(r.unwrapErr());
      updated = r.unwrap();
    }
    if (input.role) {
      const r = updated.updateRole(input.role);
      if (r.isErr()) return Result.Err(r.unwrapErr());
      updated = r.unwrap();
    }
    if (input.password) {
      const hash = await this.auth.hashPassword(input.password);
      if (hash.isErr()) return Result.Err(new Error('Failed to hash password'));
      const r = updated.updatePassword(hash.unwrap());
      if (r.isErr()) return Result.Err(r.unwrapErr());
      updated = r.unwrap();
    }

    const save = await this.userRepo.updateUser(updated);
    if (save.isErr()) return Result.Err(new Error('Failed to update user'));
    const u = save.unwrap();
    return Result.Ok({ id: u.id, name: u.name, email: u.email, role: u.role });
  }
}

