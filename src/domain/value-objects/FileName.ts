import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

export class FileName extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }

  static create(raw: string): AppResult<FileName> {
    if (typeof raw !== 'string') return AppResult.Err(AppError.Generic('Filename must be a string'));
    const name = raw.trim();
    if (name.length === 0) return AppResult.Err(AppError.Generic('Filename cannot be empty'));
    if (name.length > 255) return AppResult.Err(AppError.Generic('Filename too long'));
    return AppResult.Ok(new FileName(name));
  }

  serialize(): string {
    return this.value;
  }
}

