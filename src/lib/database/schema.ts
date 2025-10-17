import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const partners = sqliteTable('partners', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  password: text('password').notNull(),
  name: text('name'),
  role: text('role', { enum: ['admin', 'partner'] }).notNull().default('partner'),
  status: text('status', { enum: ['active', 'inactive'] }).notNull().default('active'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const collections = sqliteTable('collections', {
  id: text('id').primaryKey(),
  partnerId: text('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  qdrantCollection: text('qdrant_collection').notNull().unique(),
  useRagByDefault: integer('use_rag_by_default', { mode: 'boolean' }).notNull().default(sql`1`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const collectionSettings = sqliteTable('collection_settings', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  semanticThreshold: integer('semantic_threshold').notNull().default(0.7),
  maxChunks: integer('max_chunks').notNull().default(5),
  searchStrategy: text('search_strategy', { enum: ['semantic', 'hybrid', 'keyword'] }).notNull().default('semantic'),
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  collectionId: text('collection_id').notNull().references(() => collections.id, { onDelete: 'cascade' }),
  partnerId: text('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),
  chunks: integer('chunks').notNull(),
  status: text('status', { enum: ['processing', 'ready', 'error'] }).notNull().default('processing'),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Relations
export const partnersRelations = relations(partners, ({ many }) => ({
  collections: many(collections),
  documents: many(documents),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  partner: one(partners, {
    fields: [collections.partnerId],
    references: [partners.id],
  }),
  settings: one(collectionSettings),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  collection: one(collections, {
    fields: [documents.collectionId],
    references: [collections.id],
  }),
  partner: one(partners, {
    fields: [documents.partnerId],
    references: [partners.id],
  }),
}));

export const collectionSettingsRelations = relations(collectionSettings, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionSettings.collectionId],
    references: [collections.id],
  }),
}));

// Types
export type Partner = InferSelectModel<typeof partners>;
export type NewPartner = InferInsertModel<typeof partners>;

export type Collection = InferSelectModel<typeof collections>;
export type NewCollection = InferInsertModel<typeof collections>;

export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;

export type CollectionSettings = InferSelectModel<typeof collectionSettings>;
export type NewCollectionSettings = InferInsertModel<typeof collectionSettings>;
