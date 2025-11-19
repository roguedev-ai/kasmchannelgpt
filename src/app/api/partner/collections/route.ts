import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/database';
import { collections, collectionSettings } from '@/lib/database/schema';
import { authOptions } from '@/lib/auth/auth-options';
import { qdrantClient } from '@/lib/rag/qdrant-client';

// GET /api/partner/collections - List all collections for authenticated partner
export async function GET(request: NextRequest) {
  try {
    // Get partner session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const partnerId = session.user.id;

    // Get all collections for this partner with document counts
    const partnerCollections = await db.query.collections.findMany({
      where: eq(collections.partnerId, partnerId),
      with: {
        settings: true,
        documents: {
          columns: {
            id: true,
          },
        },
      },
      orderBy: (collections, { asc }) => [asc(collections.createdAt)],
    });

    // Transform to include document counts
    const collectionsWithStats = partnerCollections.map(collection => ({
      id: collection.id,
      partnerId: collection.partnerId,
      name: collection.name,
      description: collection.description,
      qdrantCollection: collection.qdrantCollection,
      useRagByDefault: collection.useRagByDefault,
      documentsCount: collection.documents?.length || 0,
      settings: collection.settings,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      collections: collectionsWithStats,
    });
  } catch (error) {
    console.error('[Partner] GET collections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

// POST /api/partner/collections - Create new collection
export async function POST(request: NextRequest) {
  try {
    // Get partner session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const partnerId = session.user.id;
    const body = await request.json();
    const { name, description, useRagByDefault = true } = body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length > 100) {
      return NextResponse.json(
        { error: 'Collection name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Check for duplicate collection name for this partner (case-insensitive)
    const existing = await db.query.collections.findFirst({
      where: and(
        eq(collections.partnerId, partnerId),
        sql`LOWER(${collections.name}) = LOWER(${name})`
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A collection with this name already exists' },
        { status: 409 }
      );
    }

    // Generate collection ID and Qdrant collection name
    const collectionId = `col_${partnerId}_${Date.now()}`;
    const collectionSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const qdrantCollectionName = `partner_${partnerId}_collection_${collectionSlug}`;

    // Create Qdrant collection first
    try {
      // Get embedding dimensions (assuming 768 for Gemini, 1536 for OpenAI)
      const dimensions = process.env.EMBEDDING_PROVIDER === 'gemini' ? 768 : 1536;
      await qdrantClient.createCollection(qdrantCollectionName, dimensions);
      console.log(`[Partner] Created Qdrant collection: ${qdrantCollectionName}`);
    } catch (qdrantError) {
      console.error('[Partner] Failed to create Qdrant collection:', qdrantError);
      return NextResponse.json(
        { error: 'Failed to create vector database collection' },
        { status: 500 }
      );
    }

    // Create collection in database
    await db.insert(collections).values({
      id: collectionId,
      partnerId,
      name: name.trim(),
      description: description?.trim() || null,
      qdrantCollection: qdrantCollectionName,
      useRagByDefault,
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    });

    // Create default collection settings
    const settingsId = `settings_${collectionId}`;
    await db.insert(collectionSettings).values({
      id: settingsId,
      collectionId,
      semanticThreshold: 0.7,
      maxChunks: 5,
      searchStrategy: 'semantic',
    });

    console.log(`[Partner] Created collection: ${name} for partner: ${partnerId}`);

    return NextResponse.json({
      success: true,
      collection: {
        id: collectionId,
        partnerId,
        name: name.trim(),
        qdrantCollection: qdrantCollectionName,
        useRagByDefault,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Partner] POST collection error:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
