import { Result } from '@carbonteq/fp';

export class TagList {
  public readonly values: string[];
  private constructor(values: string[]) { this.values = values; }

  static create(input?: string[] | null): Result<TagList, Error> {
    const list = Array.isArray(input) ? input : [];
    const cleaned = Array.from(new Set(list.map((t) => String(t).trim()).filter(Boolean)));
    if (cleaned.length > 50) {
      return Result.Err(new Error('Too many tags'));
    }
    if (cleaned.some((t) => t.length > 50)) {
      return Result.Err(new Error('Tag too long'));
    }
    return Result.Ok(new TagList(cleaned));
  }
}

