import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';
import { v4 as uuidv4 } from 'uuid';

export class UserId extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }
  
  static create(raw?: string): AppResult<UserId> {
    const id = raw ?? uuidv4();
    if (!id || typeof id !== 'string') return AppResult.Err(AppError.Generic('Invalid UserId'));
    return AppResult.Ok(new UserId(id));
  }

  serialize(): string {
    return this.value;
  }
}

export class DocumentId extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }
  
  static create(raw?: string): AppResult<DocumentId> {
    const id = raw ?? uuidv4();
    if (!id || typeof id !== 'string') return AppResult.Err(AppError.Generic('Invalid DocumentId'));
    return AppResult.Ok(new DocumentId(id));
  }

  serialize(): string {
    return this.value;
  }
}

