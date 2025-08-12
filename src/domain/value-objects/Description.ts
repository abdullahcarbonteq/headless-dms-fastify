import { Result } from '@carbonteq/fp';

export class Description {
  public readonly value: string | null;
  private constructor(value: string | null) { this.value = value; }

  static create(raw?: string | null): Result<Description, Error> {
    if (raw == null) return Result.Ok(new Description(null));
    const text = String(raw);
    if (text.length > 1000) {
      return Result.Err(new Error('Description too long'));
    }
    return Result.Ok(new Description(text));
  }
}

