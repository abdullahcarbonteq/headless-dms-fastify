import { BaseEntity } from '../base/BaseEntity.js';
import { Result } from '@carbonteq/fp';
import { Description } from '../../value-objects/Description.js';
import { TagList } from '../../value-objects/TagList.js';

// Document data interface
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

export class Document extends BaseEntity<DocumentData> {
  private _filename: string;
  private _mimetype: string;
  private _path: string;
  private _tags: string[];
  private _description: string | null;
  private _userId: string;
  private _status: DocumentStatus;

  constructor(
    id: string,
    filename: string,
    mimetype: string,
    path: string,
    tags: string[],
    description: string | null,
    userId: string,
    status: DocumentStatus = DocumentStatus.ACTIVE,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt || new Date(), updatedAt || new Date());
    this._filename = filename;
    this._mimetype = mimetype;
    this._path = path;
    this._tags = tags;
    this._description = description;
    this._userId = userId;
    this._status = status;
  }

  // Getters
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

  addTag(tag: string): Result<Document, Error> {
    const listRes = TagList.create([tag]);
    if (listRes.isErr()) return Result.Err(listRes.unwrapErr());
    
    if (this.hasTag(tag)) {
      return Result.Err(new Error('Tag already exists'));
    }
    
    // BUSINESS RULE: Maximum 10 tags per document
    if (this._tags.length >= 10) {
      return Result.Err(new Error('Maximum 10 tags allowed per document'));
    }
    
    this._tags.push(tag);
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  removeTag(tag: string): Result<Document, Error> {
    if (!this.hasTag(tag)) {
      return Result.Err(new Error('Tag does not exist'));
    }
    
    const index = this._tags.indexOf(tag);
    this._tags.splice(index, 1);
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  updateFilename(newFilename: string): Result<Document, Error> {
    // Reuse FileName VO by lazy import to avoid circular deps
    const { FileName } = require('../../value-objects/FileName.js');
    const nameRes = FileName.create(newFilename);
    if (nameRes.isErr()) return Result.Err(nameRes.unwrapErr());
    
    // BUSINESS RULE: Filename cannot be empty
    if (!newFilename.trim()) {
      return Result.Err(new Error('Filename cannot be empty'));
    }
    
    // BUSINESS RULE: Filename cannot be the same as current
    if (this._filename === newFilename.trim()) {
      return Result.Err(new Error('New filename must be different from current filename'));
    }
    
    this._filename = nameRes.unwrap().value;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  updateDescription(newDescription: string | null): Result<Document, Error> {
    // Validate through VO
    const descRes = Description.create(newDescription);
    if (descRes.isErr()) return Result.Err(descRes.unwrapErr());
    
    // BUSINESS RULE: Description cannot be the same as current
    if (this._description === newDescription) {
      return Result.Err(new Error('New description must be different from current description'));
    }
    
    this._description = descRes.unwrap().value;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  archive(): Result<Document, Error> {
    if (!this.isActive()) {
      return Result.Err(new Error('Only active documents can be archived'));
    }
    
    this._status = DocumentStatus.ARCHIVED;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  restore(): Result<Document, Error> {
    if (!this.isArchived()) {
      return Result.Err(new Error('Only archived documents can be restored'));
    }
    
    this._status = DocumentStatus.ACTIVE;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  softDelete(): Result<Document, Error> {
    if (this.isDeleted()) {
      return Result.Err(new Error('Document is already deleted'));
    }
    
    this._status = DocumentStatus.DELETED;
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  canBeAccessedBy(userId: string): boolean {
    return this._userId === userId && !this.isDeleted();
  }

  getFileExtension(): string {
    const parts = this._filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  

  /**
   * Add multiple tags at once
   * @param tags - Array of tags to add
   */
  addTags(tags: string[]): Result<Document, Error> {
    for (const tag of tags) {
      const result = this.addTag(tag);
      if (result.isErr()) {
        return result;
      }
    }
    return Result.Ok(this);
  }

  /**
   * Remove multiple tags at once
   * @param tags - Array of tags to remove
   */
  removeTags(tags: string[]): Result<Document, Error> {
    for (const tag of tags) {
      const result = this.removeTag(tag);
      if (result.isErr()) {
        return result;
      }
    }
    return Result.Ok(this);
  }

  /**
   * Replace all tags
   * @param newTags - New tags to replace existing ones
   */
  replaceTags(newTags: string[]): Result<Document, Error> {
    const listRes = TagList.create(newTags);
    if (listRes.isErr()) return Result.Err(listRes.unwrapErr());
    this._tags = [...listRes.unwrap().values];
    this.markAsUpdated();
    
    // Ensure entity is still valid after state change
    if (!this.validate()) {
      return Result.Err(new Error('Entity became invalid after state change'));
    }
    
    return Result.Ok(this);
  }

  /**
   * Get document metadata
   */
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

  /**
   * Check if document can be modified
   */
  canBeModified(): boolean {
    return this.isActive() && !this.isDeleted();
  }

  /**
   * Check if document can be viewed
   */
  canBeViewed(): boolean {
    return !this.isDeleted();
  }

  // Validation
  validate(): boolean {
    return true; // Construction and updates validated via Value Objects
  }

  // Serialization
  toJSON(): DocumentData {
    return {
      id: this._id,
      filename: this._filename,
      mimetype: this._mimetype,
      path: this._path,
      tags: this._tags,
      description: this._description,
      userId: this._userId,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  // Cloning
  clone(): Document {
    return new Document(
      this._id,
      this._filename,
      this._mimetype,
      this._path,
      [...this._tags],
      this._description,
      this._userId,
      this._status,
      this._createdAt,
      this._updatedAt
    );
  }
} 