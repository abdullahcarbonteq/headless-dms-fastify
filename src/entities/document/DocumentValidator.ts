import { Document, DocumentStatus } from './Document.js';

export class DocumentValidator {
  // Individual field validations
  static validateFilename(filename: string): boolean {
    return filename.length > 0 && filename.length <= 255;
  }

  static validateMimetype(mimetype: string): boolean {
    return mimetype.length > 0 && mimetype.length <= 100;
  }

  static validatePath(path: string): boolean {
    return path.length > 0 && path.length <= 500;
  }

  static validateTags(tags: string[]): boolean {
    if (!Array.isArray(tags)) return false;
    
    return tags.every(tag => this.validateTag(tag));
  }

  static validateTag(tag: string): boolean {
    return tag.length > 0 && tag.length <= 50 && /^[a-zA-Z0-9\s-_]+$/.test(tag);
  }

  static validateDescription(description: string | null): boolean {
    if (description === null) return true;
    return description.length <= 1000;
  }

  static validateUserId(userId: string): boolean {
    return userId.length > 0 && userId.length <= 100;
  }

  static validateStatus(status: string): boolean {
    return Object.values(DocumentStatus).includes(status as DocumentStatus);
  }

  // Complete document validation
  static validateDocument(document: Document): boolean {
    return (
      this.validateFilename(document.filename) &&
      this.validateMimetype(document.mimetype) &&
      this.validatePath(document.path) &&
      this.validateTags(document.tags) &&
      this.validateDescription(document.description) &&
      this.validateUserId(document.userId) &&
      this.validateStatus(document.status)
    );
  }

  // Validation for creating new documents
  static validateCreateDocumentData(data: {
    filename: string;
    mimetype: string;
    path: string;
    tags?: string[];
    description?: string | null;
    userId: string;
  }): boolean {
    return (
      this.validateFilename(data.filename) &&
      this.validateMimetype(data.mimetype) &&
      this.validatePath(data.path) &&
      this.validateTags(data.tags || []) &&
      this.validateDescription(data.description || null) &&
      this.validateUserId(data.userId)
    );
  }

  // Validation for updating documents
  static validateUpdateDocumentData(data: {
    filename?: string;
    tags?: string[];
    description?: string | null;
  }): boolean {
    if (data.filename !== undefined && !this.validateFilename(data.filename)) {
      return false;
    }
    
    if (data.tags !== undefined && !this.validateTags(data.tags)) {
      return false;
    }
    
    if (data.description !== undefined && !this.validateDescription(data.description)) {
      return false;
    }
    
    return true;
  }

  // Business rule validations
  static canBeArchived(document: Document): boolean {
    return document.isActive();
  }

  static canBeRestored(document: Document): boolean {
    return document.isArchived();
  }

  static canBeDeleted(document: Document): boolean {
    return !document.isDeleted();
  }

  static canBeAccessedBy(document: Document, userId: string): boolean {
    return document.canBeAccessedBy(userId);
  }

  static isValidFileType(mimetype: string): boolean {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    return allowedTypes.includes(mimetype);
  }

  static isValidFileSize(sizeInBytes: number): boolean {
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    return sizeInBytes > 0 && sizeInBytes <= maxSizeInBytes;
  }
} 