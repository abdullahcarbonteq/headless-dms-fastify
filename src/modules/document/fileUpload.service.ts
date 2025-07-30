import { IFileUploadService, FileUploadData } from './interfaces/IFileUploadService.js';
import { InsertDocumentDTO, uploadSchema } from './document.dto.js';
import { Result } from '@carbonteq/fp';
import { config } from '../../config/index.js';

export const FileUploadService: IFileUploadService = {
  async processFileUpload(fileData: FileUploadData): Promise<Result<InsertDocumentDTO, Error>> {
    try {
      // Validate file size
      if (fileData.file.size > config.app.upload.maxFileSize) {
        return Result.Err(new Error(
          `File too large. Maximum size is ${config.app.upload.maxFileSize / (1024 * 1024)}MB`
        ));
      }

      // Validate file type
      if (!config.app.upload.allowedMimeTypes.includes(fileData.file.mimetype)) {
        return Result.Err(new Error(
          `File type not allowed. Allowed types: ${config.app.upload.allowedMimeTypes.join(', ')}`
        ));
      }

      // Parse tags
      let tagsString = '[]';
      if (fileData.fields.tags) {
        try {
          if (typeof fileData.fields.tags === 'string') {
            const parsed = JSON.parse(fileData.fields.tags);
            if (Array.isArray(parsed)) {
              tagsString = JSON.stringify(parsed.map(String));
            } else if (typeof parsed === 'string') {
              tagsString = JSON.stringify([parsed]);
            } else {
              tagsString = '[]';
            }
          } else {
            tagsString = JSON.stringify(fileData.fields.tags);
          }
        } catch {
          tagsString = JSON.stringify(fileData.fields.tags.split(',').map((t: string) => t.trim()));
        }
      }

      const description = fileData.fields.description || undefined;

      // Validate with Zod schema
      const validation = uploadSchema.safeParse({
        filename: fileData.fields.filename,
        mimetype: fileData.fields.mimetype,
        path: fileData.file.path,
        tags: tagsString,
        description,
        userId: fileData.userId,
      });

      if (!validation.success) {
        return Result.Err(new Error(`Validation failed: ${validation.error.message}`));
      }

      return Result.Ok(validation.data);
    } catch (error) {
      return Result.Err(error instanceof Error ? error : new Error('File processing failed'));
    }
  }
}; 