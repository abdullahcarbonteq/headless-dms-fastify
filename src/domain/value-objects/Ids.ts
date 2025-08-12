import { Result } from '@carbonteq/fp';
import { v4 as uuidv4 } from 'uuid';

export class UserId {
  public readonly value: string;
  private constructor(value: string) { this.value = value; }
  static create(raw?: string): Result<UserId, Error> {
    const id = raw ?? uuidv4();
    if (!id || typeof id !== 'string') return Result.Err(new Error('Invalid UserId'));
    return Result.Ok(new UserId(id));
  }
}

export class DocumentId {
  public readonly value: string;
  private constructor(value: string) { this.value = value; }
  static create(raw?: string): Result<DocumentId, Error> {
    const id = raw ?? uuidv4();
    if (!id || typeof id !== 'string') return Result.Err(new Error('Invalid DocumentId'));
    return Result.Ok(new DocumentId(id));
  }
}

