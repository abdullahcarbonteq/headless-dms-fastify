import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

export class EmailAddress extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }

  static create(raw: string): AppResult<EmailAddress> {
    if (typeof raw !== 'string') {
      return AppResult.Err(AppError.Generic('Email must be a string'));
    }
    const email = raw.trim().toLowerCase();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return AppResult.Err(AppError.Generic('Invalid email format'));
    }
    if (email.length > 254) return AppResult.Err(AppError.Generic('Email too long'));
    return AppResult.Ok(new EmailAddress(email));
  }

  serialize(): string {
    return this.value;
  }
}

