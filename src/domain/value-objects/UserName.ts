import { Result } from '@carbonteq/fp';

export class UserName {
  public readonly value: string;
  private constructor(value: string) { this.value = value; }

  static create(raw: string): Result<UserName, Error> {
    if (typeof raw !== 'string') return Result.Err(new Error('Name must be a string'));
    const name = raw.trim();
    if (name.length < 2) return Result.Err(new Error('Name too short'));
    if (name.length > 100) return Result.Err(new Error('Name too long'));
    return Result.Ok(new UserName(name));
  }
}

