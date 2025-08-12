import { Result } from '@carbonteq/fp';

export class EmailAddress {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Result<EmailAddress, Error> {
    if (typeof raw !== 'string') {
      return Result.Err(new Error('Email must be a string'));
    }
    const email = raw.trim().toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return Result.Err(new Error('Invalid email format'));
    }
    return Result.Ok(new EmailAddress(email));
  }
}

