import { Document, DocumentStatus } from './Document.js';

/**
 * Document validator - handles BUSINESS RULE validation only
 * Input validation is handled by DTOs (Zod schemas)
 * Business rules are domain-specific logic that can be tested independently
 */
export class DocumentValidator {
  // BUSINESS RULE: Validate filename format and content
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

  // BUSINESS RULE: Check if document can be archived
  static canBeArchived(document: Document): boolean {
    // BUSINESS RULE: Only active documents can be archived
    return document.isActive();
  }

  // BUSINESS RULE: Check if document can be restored
  static canBeRestored(document: Document): boolean {
    // BUSINESS RULE: Only archived documents can be restored
    return document.isArchived();
  }



  // BUSINESS RULE: Check if file type is allowed
  static isValidFileType(mimetype: string): boolean {
    // BUSINESS RULE: Only certain file types are allowed for security
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return allowedTypes.includes(mimetype);
  }

  // BUSINESS RULE: Check if file size is within limits
  static isValidFileSize(sizeInBytes: number): boolean {
    // BUSINESS RULE: File size must be within acceptable limits
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    return sizeInBytes > 0 && sizeInBytes <= maxSizeInBytes;
  }

  // BUSINESS RULE: Check if document can be updated
  static canBeUpdated(document: Document): boolean {
    // BUSINESS RULE: Cannot update archived documents
    // BUSINESS RULE: Cannot update documents that are being processed
    return document.isActive();
  }

  // BUSINESS RULE: Check if tags are valid for this document type
  static areTagsValidForDocumentType(tags: string[], mimetype: string): boolean {
    // BUSINESS RULE: Certain document types require specific tags
    // BUSINESS RULE: Tags must be relevant to the document content
    return tags.length <= 10; // Placeholder - more complex logic would be implemented
  }


} 