import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '@/lib/database';
import { collections, collectionSettings } from '@/lib/database/schema';
import { authOptions } from '@/lib/auth/auth-options';
import { qdrantClient } from '@/lib/rag/qdrant-client';

interface RouteContext {
  params: {
    id: string;
  };
}

// Helper function to verify collection ownership
async function verifyCollectionOwnership(collectionId: string, partnerId: string) {
  const collection = await db.query.collections.findFirst({
    where: and(
      eq(collections.id, collectionId),
      eq(collections.partnerId, partnerId)
    ),
  });

  return collection;
}

// GET /api/partner/collections/:id - Get single collection with details
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
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
    const collectionId = params.id;

    // Get collection with full details (verify ownership)
    const collection = await db.query.collections.findFirst({
      where: and(
        eq(collections.id, collectionId),
        eq(collections.partnerId, partnerId)
      ),
      with: {
        settings: true,
        documents: {
          columns: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            chunks: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Return collection with stats
    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        partnerId: collection.partnerId,
        name: collection.name,
        description: collection.description,
        qdrantCollection: collection.qdrantCollection,
        useRagByDefault: collection.useRagByDefault,
        documentsCount: collection.documents?.length || 0,
        documents: collection.documents,
        settings: collection.settings,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Partner] GET collection error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection' },
      { status: 500 }
    );
  }
}

// PATCH /api/partner/collections/:id - Update collection
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
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
    const collectionId = params.id;
    const body = await request.json();

    // Verify ownership
    const collection = await verifyCollectionOwnership(collectionId, partnerId);
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    };

    if (body.name !== undefined) {
      // Validate name length
      if (body.name.length > 100) {
        return NextResponse.json(
          { error: 'Collection name must be 100 characters or less' },
          { status: 400 }
        );
      }

      // Check for duplicate name (case-insensitive, excluding current collection)
      const existingName = await db.query.collections.findFirst({
        where: and(
          eq(collections.partnerId, partnerId),
          sql`LOWER(${collections.name}) = LOWER(${body.name})`,
          sql`${collections.id} != ${collectionId}`
        ),
      });

      if (existingName) {
        return NextResponse.json(
          { error: 'A collection with this name already exists' },
          { status: 409 }
        );
      }

      updateData.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.useRagByDefault !== undefined) {
      updateData.useRagByDefault = body.useRagByDefault;
    }

    // Update collection
    await db
      .update(collections)
      .set(updateData)
      .where(eq(collections.id, collectionId));

    // Update collection settings if provided
    if (body.settings) {
      const settingsUpdate: any = {};
      
      if (body.settings.semanticThreshold !== undefined) {
        settingsUpdate.semanticThreshold = body.settings.semanticThreshold;
      }
      if (body.settings.maxChunks !== undefined) {
        settingsUpdate.maxChunks = body.settings.maxChunks;
      }
      if (body.settings.searchStrategy !== undefined) {
        settingsUpdate.searchStrategy = body.settings.searchStrategy;
      }

      if (Object.keys(settingsUpdate).length > 0) {
        await db
          .update(collectionSettings)
          .set(settingsUpdate)
          .where(eq(collectionSettings.collectionId, collectionId));
      }
    }

    console.log(`[Partner] Updated collection: ${collectionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Partner] PATCH collection error:', error);
    return NextResponse.json(
      { error: 'Failed to update collection' },
      { status: 500 }
    );
  }
}

// DELETE /api/partner/collections/:id - Delete collection
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
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
    const collectionId = params.id;

    // Verify ownership
    const collection = await verifyCollectionOwnership(collectionId, partnerId);
    
    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Prevent deleting default "General" collection
    if (collection.name.toLowerCase() === 'general') {
      return NextResponse.json(
        { error: 'Cannot delete the default General collection' },
        { status: 403 }
      );
    }

    // Delete from Qdrant first
    try {
      // Note: We'll need to implement deleteCollection in qdrant-client if not exists
      // For now, log the intent
      console.log(`[Partner] Would delete Qdrant collection: ${collection.qdrantCollection}`);
      // await qdrantClient.deleteCollection(collection.qdrantCollection);
    } catch (qdrantError) {
      console.error('[Partner] Failed to delete Qdrant collection:', qdrantError);
      // Continue with database deletion even if Qdrant fails
    }

    // Delete from database (cascade will handle documents and settings)
    await db
      .delete(collections)
      .where(eq(collections.id, collectionId));

    console.log(`[Partner] Deleted collection: ${collectionId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Partner] DELETE collection error:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection' },
      { status: 500 }
    );
  }
}
