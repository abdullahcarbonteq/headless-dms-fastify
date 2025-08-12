import { Result } from '@carbonteq/fp';

export class PasswordHash {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(hash: string): Result<PasswordHash, Error> {
    if (typeof hash !== 'string' || hash.length < 10) {
      return Result.Err(new Error('Invalid password hash'));
    }
    return Result.Ok(new PasswordHash(hash));
  }
}

