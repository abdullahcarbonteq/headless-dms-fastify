import { Result } from '@carbonteq/fp';

export class FileName {
  public readonly value: string;
  private constructor(value: string) { this.value = value; }

  static create(raw: string): Result<FileName, Error> {
    if (typeof raw !== 'string') return Result.Err(new Error('Filename must be a string'));
    const name = raw.trim();
    if (name.length === 0) return Result.Err(new Error('Filename cannot be empty'));
    if (name.length > 255) return Result.Err(new Error('Filename too long'));
    return Result.Ok(new FileName(name));
  }
}

