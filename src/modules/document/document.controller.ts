import { FastifyReply, FastifyRequest } from 'fastify';
import { uploadSchema } from './document.dto';
import { DocumentService } from './document.service';
import { MultipartFile } from '@fastify/multipart';

export const DocumentController = {
  async upload(req: FastifyRequest, reply: FastifyReply) {
    const parts = req.parts();
    let file: MultipartFile | null = null;
    let metadata: any = {};

    for await (const part of parts) {
      if (part.type === 'file') {
        file = part as MultipartFile;
      } else if (part.type === 'field') {
        metadata[part.fieldname] = part.value;
      }
    }

    const parsed = uploadSchema.safeParse(metadata);
    if (!parsed.success || !file) {
      return reply.status(400).send({ error: parsed.error?.format?.() || 'File is required' });
    }

    await DocumentService.uploadDocument(file, parsed.data);
    return reply.status(201).send({ message: 'Document uploaded successfully' });
  },
};
