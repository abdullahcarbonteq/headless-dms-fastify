import { BaseEntity, AppResult, AppError, UUID, DateTime } from '@carbonteq/hexapp';
import { Description } from '../../value-objects/Description.js';
import { FileName } from '../../value-objects/FileName.js';
import { TagList } from '../../value-objects/TagList.js';

export interface DocumentData {
  id: string;
  filename: string;
  mimetype: string;
  path: string;
  tags: string[];
  description: string | null;
  userId: string;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export class Document extends BaseEntity {
  private _filename: string;
  private _mimetype: string;
  private _path: string;
  private _tags: string[];
  private _description: string | null;
  private _userId: string;
  private _status: DocumentStatus;

  constructor(
    id: UUID,
    filename: string,
    mimetype: string,
    path: string,
    tags: string[],
    description: string | null,
    userId: string,
    status: DocumentStatus = DocumentStatus.ACTIVE,
    createdAt?: DateTime,
    updatedAt?: DateTime
  ) {
    super();
    this._copyBaseProps({ id, createdAt: createdAt || DateTime.now(), updatedAt: updatedAt || DateTime.now() });
    this._filename = filename;
    this._mimetype = mimetype;
    this._path = path;
    this._tags = tags;
    this._description = description;
    this._userId = userId;
    this._status = status;
  }

  get filename(): string { return this._filename; }
  get mimetype(): string { return this._mimetype; }
  get path(): string { return this._path; }
  get tags(): string[] { return [...this._tags]; } // Return copy to prevent external modification
  get description(): string | null { return this._description; }
  get userId(): string { return this._userId; }
  get status(): DocumentStatus { return this._status; }

  // Business Logic Methods
  isActive(): boolean {
    return this._status === DocumentStatus.ACTIVE;
  }

  isArchived(): boolean {
    return this._status === DocumentStatus.ARCHIVED;
  }

  isDeleted(): boolean {
    return this._status === DocumentStatus.DELETED;
  }

  isImage(): boolean {
    return this._mimetype.startsWith('image/');
  }

  isPDF(): boolean {
    return this._mimetype === 'application/pdf';
  }

  isTextFile(): boolean {
    return this._mimetype.startsWith('text/');
  }

  hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  addTag(tag: string): AppResult<Document> {
    const listRes = TagList.create([tag]);
    if (listRes.isErr()) return AppResult.Err(AppError.Generic(listRes.unwrapErr().message));
    
    if (this.hasTag(tag)) {
      return AppResult.Err(AppError.Generic('Tag already exists'));
    }

    this._tags.push(tag);
    this.markUpdated();
    return AppResult.Ok(this);
  }

  removeTag(tag: string): AppResult<Document> {
    const index = this._tags.indexOf(tag);
    if (index === -1) {
      return AppResult.Err(AppError.Generic('Tag does not exist'));
    }

    this._tags.splice(index, 1);
    this.markUpdated();
    return AppResult.Ok(this);
  }

  updateTags(tags: string[]): AppResult<Document> {
    const listRes = TagList.create(tags);
    if (listRes.isErr()) return AppResult.Err(AppError.Generic(listRes.unwrapErr().message));
    
    this._tags = [...tags];
    this.markUpdated();
    return AppResult.Ok(this);
  }

  updateDescription(description: string | null): AppResult<Document> {
    const descRes = Description.create(description);
    if (descRes.isErr()) return AppResult.Err(AppError.Generic(descRes.unwrapErr().message));
    
    this._description = description;
    this.markUpdated();
    return AppResult.Ok(this);
  }

  updateFilename(filename: string): AppResult<Document> {
    const nameRes = FileName.create(filename);
    if (nameRes.isErr()) return AppResult.Err(AppError.Generic(nameRes.unwrapErr().message));
    
    this._filename = filename;
    this.markUpdated();
    return AppResult.Ok(this);
  }

  updateMimeType(mimetype: string): AppResult<Document> {
    // Basic validation - could be enhanced with MimeType value object
    if (!mimetype || mimetype.trim() === '') {
      return AppResult.Err(AppError.Generic('MIME type cannot be empty'));
    }

    this._mimetype = mimetype;
    this.markUpdated();
    return AppResult.Ok(this);
  }

  updatePath(path: string): AppResult<Document> {
    if (!path || path.trim() === '') {
      return AppResult.Err(AppError.Generic('Path cannot be empty'));
    }

    this._path = path;
    this.markUpdated();
    return AppResult.Ok(this);
  }

  archive(): AppResult<Document> {
    if (this._status === DocumentStatus.ARCHIVED) {
      return AppResult.Err(AppError.Generic('Document is already archived'));
    }

    this._status = DocumentStatus.ARCHIVED;
    this.markUpdated();
    return AppResult.Ok(this);
  }

  activate(): AppResult<Document> {
    if (this._status === DocumentStatus.ACTIVE) {
      return AppResult.Err(AppError.Generic('Document is already active'));
    }

    this._status = DocumentStatus.ACTIVE;
    this.markUpdated();
    return AppResult.Ok(this);
  }

  softDelete(): AppResult<Document> {
    if (this._status === DocumentStatus.DELETED) {
      return AppResult.Err(AppError.Generic('Document is already deleted'));
    }

    this._status = DocumentStatus.DELETED;
    this.markUpdated();
    return AppResult.Ok(this);
  }

  canBeAccessedBy(userId: string): boolean {
    return this._userId === userId && !this.isDeleted();
  }

  getFileExtension(): string {
    const parts = this._filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  

  /**
   * Add multiple tags at once (
   */
  // addTags(tags: string[]): Result<Document, Error> {
  //   for (const tag of tags) {
  //     const result = this.addTag(tag);
  //     if (result.isErr()) {
  //       return result;
  //     }
  //   }
  //   return Result.Ok(this);
  // }

  /**
   * Remove multiple tags at once 
   */
  // removeTags(tags: string[]): Result<Document, Error> {
  //   for (const tag of tags) {
  //     const result = this.removeTag(tag);
  //     if (result.isErr()) {
  //       return result;
  //     }
  //   }
  //   return Result.Ok(this);
  // }

  /**
   * Replace all tags
   * @param newTags - New tags to replace existing ones
   */
  replaceTags(newTags: string[]): AppResult<Document> {
    const listRes = TagList.create(newTags);
    if (listRes.isErr()) return AppResult.Err(AppError.Generic(listRes.unwrapErr().message));
    this._tags = [...listRes.unwrap().values];
    this.markUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return AppResult.Err(AppError.Generic('Entity became invalid after state change'));
    }
    
    return AppResult.Ok(this);
  }

  
  getMetadata(): {
    filename: string;
    mimetype: string;
    extension: string;
    isImage: boolean;
    isPDF: boolean;
    isTextFile: boolean;
    tagCount: number;
    status: DocumentStatus;
  } {
    return {
      filename: this._filename,
      mimetype: this._mimetype,
      extension: this.getFileExtension(),
      isImage: this.isImage(),
      isPDF: this.isPDF(),
      isTextFile: this.isTextFile(),
      tagCount: this._tags.length,
      status: this._status
    };
  }

  
  canBeModified(): boolean {
    return this.isActive() && !this.isDeleted();
  }

  
  canBeViewed(): boolean {
    return !this.isDeleted();
  }

  // Validation method
  validate(): boolean {
    return this._filename.length > 0 && 
           this._mimetype.length > 0 && 
           this._path.length > 0 && 
           this._userId.length > 0;
  }

  // Serialization method required by hexapp BaseEntity
  serialize(): DocumentData {
    return {
      id: this.id.toString(),
      filename: this._filename,
      mimetype: this._mimetype,
      path: this._path,
      tags: [...this._tags],
      description: this._description,
      userId: this._userId,
      status: this._status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Clone method
  clone(): Document {
    return new Document(
      this.id,
      this._filename,
      this._mimetype,
      this._path,
      [...this._tags],
      this._description,
      this._userId,
      this._status,
      this.createdAt,
      this.updatedAt
    );
  }

  // Static factory method
  static create(data: DocumentData): AppResult<Document> {
    try {
      const document = new Document(
        UUID.fromTrusted(data.id),
        data.filename,
        data.mimetype,
        data.path,
        data.tags,
        data.description,
        data.userId,
        data.status,
        DateTime.from(data.createdAt),
        DateTime.from(data.updatedAt)
      );

      if (!document.validate()) {
        return AppResult.Err(AppError.Generic('Invalid document data'));
      }

      return AppResult.Ok(document);
    } catch (error) {
      return AppResult.Err(AppError.Generic('Failed to create document'));
    }
  }

  // Static factory method for new documents
  static createNew(
    filename: string,
    mimetype: string,
    path: string,
    tags: string[],
    description: string | null,
    userId: string
  ): AppResult<Document> {
    try {
      const document = new Document(
        UUID.init(),
        filename,
        mimetype,
        path,
        tags,
        description,
        userId
      );

      if (!document.validate()) {
        return AppResult.Err(AppError.Generic('Invalid document data'));
      }

      return AppResult.Ok(document);
    } catch (error) {
      return AppResult.Err(AppError.Generic('Failed to create document'));
    }
  }

  // Static factory method from database row
  static fromDatabaseRow(row: any): AppResult<Document> {
    try {
      return Document.create({
        id: row.id,
        filename: row.filename,
        mimetype: row.mimetype,
        path: row.path,
        tags: row.tags || [],
        description: row.description,
        userId: row.user_id,
        status: row.status || DocumentStatus.ACTIVE,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      });
    } catch (error) {
      return AppResult.Err(AppError.Generic('Failed to create document from database row'));
    }
  }

  // JSON serialization for API responses
  toJSON(): DocumentData {
    return this.serialize();
  }
} 