import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

export class PasswordHash extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }

  static create(raw: string): AppResult<PasswordHash> {
    if (!raw || typeof raw !== 'string' || !raw.startsWith('$2b$')) return AppResult.Err(AppError.Generic('Invalid password hash'));
    return AppResult.Ok(new PasswordHash(raw));
  }

  serialize(): string {
    return this.value;
  }
}

