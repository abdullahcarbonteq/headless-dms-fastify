import { InsertDocumentDTO } from '../document.dto.js';
import { Result } from '@carbonteq/fp';

export interface FileUploadData {
  file: {
    path: string;
    filename: string;
    mimetype: string;
    size: number;
  };
  fields: {
    filename: string;
    mimetype: string;
    tags?: string;
    description?: string;
  };
  userId: string;
}

export interface IFileUploadService {
  /**
   * Process file upload and return document data
   * @param fileData - File upload data from multipart request
   * @returns Promise<Result<InsertDocumentDTO, Error>> - Success with document data or error
   */
  processFileUpload(fileData: FileUploadData): Promise<Result<InsertDocumentDTO, Error>>;
} 