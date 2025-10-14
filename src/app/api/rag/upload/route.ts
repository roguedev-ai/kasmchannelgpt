import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { uploadHandler } from '../../../../lib/rag/upload-handler';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const session = await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );
    
    // Get request body
    const body = await request.json();
    const { text, metadata } = body;
    
    // Validate request
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    // Process document
    await uploadHandler.processText(text, metadata, session.user.partner_id);
    
    return NextResponse.json({
      success: true,
    });
    
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process upload', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
