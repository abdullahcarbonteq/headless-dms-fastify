import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

export class UserName extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }

  static create(raw: string): AppResult<UserName> {
    if (!raw || typeof raw !== 'string') return AppResult.Err(AppError.Generic('Invalid username'));
    const name = raw.trim();
    if (name.length < 2) return AppResult.Err(AppError.Generic('Username is too short'));
    if (name.length > 100) return AppResult.Err(AppError.Generic('Username too long'));
    return AppResult.Ok(new UserName(name));
  }

  serialize(): string {
    return this.value;
  }
}

