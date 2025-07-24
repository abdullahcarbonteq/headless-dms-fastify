import { db } from '@/config/db';
import { documents } from './document.schema';
import { InsertDocumentDTO } from './document.dto';
import { v4 as uuidv4 } from 'uuid';

export const DocumentRepository = {
  async create(data: InsertDocumentDTO) {
    await db.insert(documents).values({
      id: uuidv4(),
      ...data,
    });
  },
};
