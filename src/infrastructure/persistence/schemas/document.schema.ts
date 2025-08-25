import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  path: text('path').notNull(),
  tags: text('tags').default('[]'),
  description: text('description'),
  userId: text('user_id').notNull(),
  storageProvider: text('storage_provider').notNull().default('fs'),
  externalKey: text('external_key'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  documentsUserIdIdx: index('documents_user_id_idx').on(t.userId),
  documentsCreatedAtIdx: index('documents_created_at_idx').on(t.createdAt),
  documentsDescriptionIdx: index('documents_description_idx').on(t.description),
  documentsStorageProviderIdx: index('documents_storage_provider_idx').on(t.storageProvider),
}))