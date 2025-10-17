import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { sql, eq, and } from 'drizzle-orm';
import Database from 'better-sqlite3';
import { partners, collections, collectionSettings, documents } from '../src/lib/database/schema';
import { nanoid } from 'nanoid';
import type { NewCollection, NewCollectionSettings } from '../src/lib/database/schema';

async function main() {
  // Create backup first
  console.log('Creating database backup...');
  const backupDb = new Database('data/app.backup.db');
  const db = new Database('data/app.db');
  db.backup(backupDb.name)
    .then(() => {
      console.log('Backup created successfully');
      backupDb.close();
    })
    .catch(err => {
      console.error('Backup failed:', err);
      process.exit(1);
    });

  const client = drizzle(db);

  try {
    console.log('Starting migration...');

    // Create tables
    await client.run(sql`
      CREATE TABLE IF NOT EXISTS partners (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'partner' CHECK (role IN ('admin', 'partner')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        qdrant_collection TEXT NOT NULL UNIQUE,
        use_rag_by_default INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS collection_settings (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        semantic_threshold REAL NOT NULL DEFAULT 0.7,
        max_chunks INTEGER NOT NULL DEFAULT 5,
        search_strategy TEXT NOT NULL DEFAULT 'semantic' CHECK (search_strategy IN ('semantic', 'hybrid', 'keyword'))
      );

      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        partner_id TEXT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        chunks INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
        error TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create indexes
    await client.run(sql`
      CREATE INDEX IF NOT EXISTS idx_collections_partner_id ON collections(partner_id);
      CREATE INDEX IF NOT EXISTS idx_documents_collection_id ON documents(collection_id);
      CREATE INDEX IF NOT EXISTS idx_documents_partner_id ON documents(partner_id);
      CREATE INDEX IF NOT EXISTS idx_collection_settings_collection_id ON collection_settings(collection_id);
    `);

    // Create default collections for existing partners
    const existingPartners = await client.select().from(partners);
    
    for (const partner of existingPartners) {
      // Check if partner already has a collection
      const partnerCollections = await client.select()
        .from(collections)
        .where(eq(collections.partnerId, partner.id));

      if (partnerCollections.length === 0) {
        // Create default "General" collection
        const collectionId = nanoid();
        const qdrantCollection = `partner_${partner.id}_collection_general`;

        const newCollection: NewCollection = {
          id: collectionId,
          partnerId: partner.id,
          name: 'General',
          description: 'Default collection for all documents',
          qdrantCollection,
          useRagByDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await client.insert(collections).values(newCollection);

        // Create default settings
        const newSettings: NewCollectionSettings = {
          id: nanoid(),
          collectionId,
          semanticThreshold: 0.7,
          maxChunks: 5,
          searchStrategy: 'semantic',
        };

        await client.insert(collectionSettings).values(newSettings);

        console.log(`Created default collection for partner ${partner.id}`);
      }
    }

    // Update existing documents to link to default collections
    const orphanedDocs = await client.select()
      .from(documents)
      .where(sql`collection_id IS NULL`);

    for (const doc of orphanedDocs) {
      const defaultCollection = await client.select()
        .from(collections)
        .where(and(
          eq(collections.partnerId, doc.partnerId),
          eq(collections.name, 'General')
        ))
        .limit(1);

      if (defaultCollection.length > 0) {
        await client.update(documents)
          .set({ collectionId: defaultCollection[0].id })
          .where(eq(documents.id, doc.id));

        console.log(`Linked document ${doc.id} to default collection`);
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Restore from backup
    console.log('Restoring from backup...');
    try {
      db.close();
      const backupDb = new Database('data/app.backup.db');
      const newDb = new Database('data/app.db');
      await backupDb.backup(newDb.name);
      console.log('Restore completed');
      backupDb.close();
      newDb.close();
    } catch (restoreError) {
      console.error('Restore failed:', restoreError);
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
