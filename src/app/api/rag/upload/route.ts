import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { fileUploadHandler } from '../../../../lib/rag/upload-handler';
import { AuthenticationError, ValidationError } from '../../../../types/backend';

export async function POST(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get('authorization');
    const session = partnerContext.extractFromHeader(authHeader);
    
    console.log(`[API] Upload request from partner: ${session.partnerId}`);
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Processing file: ${file.name} (${file.size} bytes)`);
    
    // Process the upload
    const result = await fileUploadHandler.processUpload(
      file,
      session.partnerId
    );
    
    console.log(`[API] Upload successful: ${result.filename}`);
    
    return NextResponse.json(result, { status: 200 });
    
  } catch (error: any) {
    console.error('[API] Upload error:', error);
    
    // Handle specific error types
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: 'Authentication failed', message: error.message },
        { status: 401 }
      );
    }
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: error.message },
        { status: 400 }
      );
    }
    
    // Generic error
    return NextResponse.json(
      { error: 'Upload failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
