import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  filename: text('filename').notNull(),
  mimetype: text('mimetype').notNull(),
  path: text('path').notNull(),
  tags: text('tags').default('[]'),
  description: text('description'),
  userId: text('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  //dummy: text('dummy').default('dummy'),
});
