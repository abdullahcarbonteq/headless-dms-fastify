import { MultipartFile } from '@fastify/multipart';
import { DocumentRepository } from './document.repository';
import { InsertDocumentDTO } from './document.dto';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const DocumentService = {
  async uploadDocument(file: MultipartFile, metadata: InsertDocumentDTO) {
    const ext = file.filename.split('.').pop();
    const uniqueName = `${uuidv4()}.${ext}`;
    const uploadPath = join('uploads', uniqueName);

    const writeStream = createWriteStream(uploadPath);
    await new Promise<void>((resolve, reject) => {
      file.file.pipe(writeStream);
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      file.file.on('error', reject);
    });

    await DocumentRepository.create({
      ...metadata,
      filename: file.filename,
      mimetype: file.mimetype,
      path: uploadPath,
    });
  },
};
