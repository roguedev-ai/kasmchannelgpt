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

    // Parse FormData
    const formData = await request.formData();
    
    // Get file from FormData
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    
    // Get optional metadata
    const metadataStr = formData.get('metadata') as string;
    const metadata = metadataStr ? JSON.parse(metadataStr) : {
      filename: file.name,
      type: file.type,
      size: file.size
    };

    // Process document
    await uploadHandler.processText(text, metadata, session.user.partner_id);

    return NextResponse.json({
      success: true,
      filename: file.name
    });
  } catch (error: any) {
    console.error('[Upload] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
