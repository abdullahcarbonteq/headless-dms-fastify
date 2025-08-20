import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

const COMMON_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/zip',
]);


export class MimeType extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }

  static create(raw: string): AppResult<MimeType> {
    if (typeof raw !== 'string' || !raw.includes('/')) {
      return AppResult.Err(AppError.Generic('Invalid MIME type'));
    }
    const mt = raw.trim().toLowerCase();
    if (!COMMON_TYPES.has(mt) && !mt.startsWith('application/') && !mt.startsWith('image/') && !mt.startsWith('text/')) {
      return AppResult.Err(AppError.Generic('Unsupported MIME type'));
    }
    return AppResult.Ok(new MimeType(mt));
  }

  serialize(): string {
    return this.value;
  }
}

