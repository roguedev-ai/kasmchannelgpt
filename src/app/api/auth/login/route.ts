import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { LoginRequest, LoginResponse } from '../../../../types/backend';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: LoginRequest = await request.json();
    const { partnerId, email } = body;
    
    // Validate input
    if (!partnerId || !email) {
      return NextResponse.json(
        { error: 'Partner ID and email are required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Login request for partner: ${partnerId}`);
    
    // Generate JWT token
    const token = partnerContext.createToken(partnerId, email);
    const namespace = partnerContext.getNamespace(partnerId);
    
    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const response: LoginResponse = {
      token,
      partnerId,
      namespace,
      expiresAt: expiresAt.toISOString(),
    };
    
    console.log(`[API] Login successful for partner: ${partnerId}`);
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    console.error('[API] Login error:', error);
    
    return NextResponse.json(
      { 
        error: 'Login failed', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
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
