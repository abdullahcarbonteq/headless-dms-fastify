import { BaseEntity } from '../base/BaseEntity.js';
import { DocumentValidator } from './DocumentValidator.js';

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

  addTag(tag: string): boolean {
    if (DocumentValidator.validateTag(tag) && !this.hasTag(tag)) {
      this._tags.push(tag);
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  removeTag(tag: string): boolean {
    const index = this._tags.indexOf(tag);
    if (index > -1) {
      this._tags.splice(index, 1);
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  updateFilename(newFilename: string): boolean {
    if (DocumentValidator.validateFilename(newFilename)) {
      this._filename = newFilename;
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  updateDescription(newDescription: string | null): boolean {
    if (DocumentValidator.validateDescription(newDescription)) {
      this._description = newDescription;
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  archive(): boolean {
    if (this.isActive()) {
      this._status = DocumentStatus.ARCHIVED;
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  restore(): boolean {
    if (this.isArchived()) {
      this._status = DocumentStatus.ACTIVE;
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  softDelete(): boolean {
    if (!this.isDeleted()) {
      this._status = DocumentStatus.DELETED;
      this.markAsUpdated();
      return true;
    }
    return false;
  }

  canBeAccessedBy(userId: string): boolean {
    return this._userId === userId && !this.isDeleted();
  }

  getFileExtension(): string {
    const parts = this._filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  getFileSize(): Promise<number> {
    // This would typically interact with the file system
    // For now, return a placeholder
    return Promise.resolve(0);
  }

  // Validation
  validate(): boolean {
    return DocumentValidator.validateDocument(this);
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