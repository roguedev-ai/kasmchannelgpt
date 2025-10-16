import { NextRequest, NextResponse } from 'next/server';
import { listAllCollections } from '../../../../lib/rag/collection-manager';
import { partnerContext } from '../../../../lib/isolation/partner-context';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );
    
    // List all collections
    const collections = await listAllCollections();
    
    return NextResponse.json({
      collections: collections,
      count: collections.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[Collections] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list collections',
        message: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
