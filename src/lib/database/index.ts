import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { partners } from './schema';

const sqlite = new Database('data/app.db');
export const db = drizzle(sqlite);

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;

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
