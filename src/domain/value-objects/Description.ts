import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

export class Description extends BaseValueObject<string | null> {
  public readonly value: string | null;
  private constructor(value: string | null) { 
    super();
    this.value = value; 
  }

  static create(raw: string | null): AppResult<Description> {
    if (raw == null) return AppResult.Ok(new Description(null));
    if (raw.length > 1000) return AppResult.Err(AppError.Generic('Description too long'));
    return AppResult.Ok(new Description(raw));
  }

  serialize(): string | null {
    return this.value;
  }
}

