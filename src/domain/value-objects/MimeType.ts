import { Result } from '@carbonteq/fp';

const COMMON_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg',
  'application/zip',
]);

export class MimeType {
  public readonly value: string;
  private constructor(value: string) { this.value = value; }

  static create(raw: string): Result<MimeType, Error> {
    if (typeof raw !== 'string' || !raw.includes('/')) {
      return Result.Err(new Error('Invalid MIME type'));
    }
    const mt = raw.trim().toLowerCase();
    // Allow any type, but if allowed list configured, one could enforce here
    // For now, accept common types and any vendor-specific string
    if (!COMMON_TYPES.has(mt) && !mt.startsWith('application/') && !mt.startsWith('image/') && !mt.startsWith('text/')) {
      return Result.Err(new Error('Unsupported MIME type'));
    }
    return Result.Ok(new MimeType(mt));
  }
}

