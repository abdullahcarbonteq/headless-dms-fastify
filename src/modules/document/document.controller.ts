import { FastifyReply, FastifyRequest } from 'fastify';
import { uploadSchema } from './document.dto';
import { DocumentService } from './document.service';
import { MultipartFile } from '@fastify/multipart';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { DocumentRepository } from './document.repository';

export const DocumentController = {
  async upload(req: FastifyRequest, reply: FastifyReply) {
    return DocumentService.uploadDocument(req, reply);
  },
  async getAll(req: FastifyRequest, reply: FastifyReply) {
    const docs = await DocumentRepository.getAll();
    return reply.send({ documents: docs });
  },
};

export async function minimalUploadHandler(req: FastifyRequest, reply: FastifyReply) {
  console.log('Minimal handler hit');
  const parts = req.parts();
  for await (const part of parts) {
    if (part.type === 'file') {
      const uploadPath = require('path').join('uploads', part.filename);
      const writeStream = require('fs').createWriteStream(uploadPath);
      part.file.pipe(writeStream);
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
        part.file.on('error', reject);
      });
      console.log('File written');
      return reply.send({ message: 'File uploaded' });
    }
  }
  reply.status(400).send({ error: 'No file found' });
}
