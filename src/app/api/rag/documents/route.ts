import { NextRequest, NextResponse } from 'next/server';
import { QdrantClient } from '@qdrant/js-client-rest';
import { partnerContext } from '@/lib/isolation/partner-context';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const session = await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );
    
    const partnerId = session.user.partner_id;
    console.log('[Documents] Listing documents for partner:', partnerId);
    
    // Get all points to extract unique document metadata
    const scrollResult = await qdrant.scroll(partnerId, {
      limit: 100,
      with_payload: true,
    });

    // Extract unique documents
    const documentsMap = new Map();
    let totalChunks = 0;
    
    for (const point of scrollResult.points) {
      totalChunks++;
      const payload = point.payload;
      const docId = payload?.document_id as string;
      const source = payload?.source as string;
      const uploadedAt = payload?.created_at as string;

      if (docId && !documentsMap.has(docId)) {
        documentsMap.set(docId, {
          documentId: docId,
          filename: source,
          uploadedAt,
          partnerId: payload?.partner_id,
          chunkCount: 0,
        });
      }
      
      // Count chunks per document
      if (docId && documentsMap.has(docId)) {
        documentsMap.get(docId).chunkCount++;
      }
    }

    const documents = Array.from(documentsMap.values()).sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    console.log(`[Documents] Found ${documents.length} documents with ${totalChunks} total chunks`);

    return NextResponse.json({
      documents,
      count: documents.length,
      totalChunks,
    });

  } catch (error) {
    console.error('[Documents] Error listing documents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const session = await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const partnerId = session.user.partner_id;
    console.log(`[Documents] Deleting document: ${documentId} for partner: ${partnerId}`);

    // Delete all points with this document_id
    await qdrant.delete(partnerId, {
      filter: {
        must: [
          {
            key: 'document_id',
            match: { value: documentId },
          },
          {
            key: 'partner_id',
            match: { value: partnerId },
          },
        ],
      },
    });

    console.log(`[Documents] Successfully deleted document: ${documentId}`);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      documentId,
    });

  } catch (error) {
    console.error('[Documents] Error deleting document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
