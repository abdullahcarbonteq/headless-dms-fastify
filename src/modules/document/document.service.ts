import { MultipartFile } from '@fastify/multipart';
import { DocumentRepository } from './document.repository';
import { InsertDocumentDTO, uploadSchema } from './document.dto';
import { createWriteStream } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const DocumentService = {
  async uploadDocument(req: any, reply: any) {
    // Dynamic imports
    const { v4: uuidv4 } = await import('uuid');
    const path = await import('path');
    const fs = await import('fs');
    const { DocumentRepository } = await import('./document.repository');

    const parts = req.parts();
    let file: any = null;
    const fields: any = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        const uniqueName = `${Date.now()}-${uuidv4()}${path.default.extname(part.filename)}`;
        const uploadPath = path.default.join('uploads', uniqueName);
        await fs.promises.mkdir('uploads', { recursive: true });
        const writeStream = fs.createWriteStream(uploadPath);
        part.file.pipe(writeStream);
        await new Promise<void>((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
          part.file.on('error', reject);
        });
        file = {
          path: uploadPath,
          filename: part.filename,
          mimetype: part.mimetype,
          size: 0,
        };
        file.size = fs.statSync(uploadPath).size.toString();
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    if (!file || !fields.filename || !fields.mimetype) {
      return reply.status(400).send({ error: 'Missing file or required fields' });
    }
    // Zod schema validation
    const validation = uploadSchema.safeParse({
      filename: fields.filename,
      mimetype: fields.mimetype,
      path: file ? file.path : ''
    });
    if (!validation.success) {
      return reply.status(400).send({ error: validation.error.format() });
    }
    await DocumentRepository.create(validation.data);
    return reply.code(201).send({ message: 'Document uploaded successfully' });
  },
};
