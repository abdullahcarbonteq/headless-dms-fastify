import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  path: text('path').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
