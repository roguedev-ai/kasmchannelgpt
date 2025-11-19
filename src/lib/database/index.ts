import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database('data/app.db');
export const db = drizzle(sqlite, { schema });

export type Partner = typeof schema.partners.$inferSelect;
export type NewPartner = typeof schema.partners.$inferInsert;

export interface PartnerWithStats {
  id: string;
  email: string;
  role: 'admin' | 'partner';
  status: 'active' | 'inactive';
  name: string | null;
  collectionsCount: number;
  documentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionStats {
  totalDocuments: number;
  totalVectors: number;
  lastUpdated: string;
}
