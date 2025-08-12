import { Result } from '@carbonteq/fp';

export class PathVO {
  public readonly value: string;
  private constructor(value: string) { this.value = value; }

  static create(raw: string): Result<PathVO, Error> {
    if (typeof raw !== 'string') return Result.Err(new Error('Path must be a string'));
    const p = raw.trim();
    if (p.length === 0) return Result.Err(new Error('Path cannot be empty'));
    if (p.length > 500) return Result.Err(new Error('Path too long'));
    return Result.Ok(new PathVO(p));
  }
}

