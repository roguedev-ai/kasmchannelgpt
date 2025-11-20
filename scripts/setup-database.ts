import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || './data/app.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

console.log('🔧 Setting up database schema...');

// Create partners table
db.exec(`
  CREATE TABLE IF NOT EXISTS partners (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'partner' CHECK(role IN ('admin', 'partner')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    partner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    qdrant_collection TEXT UNIQUE NOT NULL,
    use_rag_by_default INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS collection_settings (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    semantic_threshold REAL DEFAULT 0.7,
    max_chunks INTEGER DEFAULT 5,
    search_strategy TEXT DEFAULT 'semantic',
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    partner_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER,
    chunks INTEGER DEFAULT 0,
    status TEXT DEFAULT 'processing',
    error TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
  );
`);

console.log('✅ Database schema created successfully!');
console.log(`📁 Database location: ${DB_PATH}`);

db.close();
