import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

export class TagList extends BaseValueObject<string[]> {
  public readonly values: string[];
  private constructor(values: string[]) { 
    super();
    this.values = values; 
  }

  static create(input?: string[] | null): AppResult<TagList> {
    const list = Array.isArray(input) ? input : [];
    const cleaned = Array.from(new Set(list.map((t) => String(t).trim()).filter(Boolean)));
    if (cleaned.length > 50) {
      return AppResult.Err(AppError.Generic('Too many tags'));
    }
    if (cleaned.some((t) => t.length > 50)) {
      return AppResult.Err(AppError.Generic('Tag too long'));
    }
    return AppResult.Ok(new TagList(cleaned));
  }

  serialize(): string[] {
    return [...this.values];
  }
}

