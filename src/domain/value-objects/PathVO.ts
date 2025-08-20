import { AppResult, AppError, BaseValueObject } from '@carbonteq/hexapp';

export class PathVO extends BaseValueObject<string> {
  public readonly value: string;
  private constructor(value: string) { 
    super();
    this.value = value; 
  }

  static create(raw: string): AppResult<PathVO> {
    if (!raw || typeof raw !== 'string') return AppResult.Err(AppError.Generic('Invalid path'));
    const path = raw.trim();
    if (path.length === 0) return AppResult.Err(AppError.Generic('Path cannot be empty'));
    if (path.length > 500) return AppResult.Err(AppError.Generic('Path too long'));
    return AppResult.Ok(new PathVO(path));
  }

  serialize(): string {
    return this.value;
  }
}

