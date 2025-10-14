import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { AuthenticationError } from '../../../../types/backend';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const session = await partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );
    
    // For now, just return mock data
    return NextResponse.json({
      partners: [
        {
          id: session.user.partner_id,
          name: 'Demo Partner',
          email: session.user.email,
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ],
    });
    
  } catch (error: any) {
    console.error('[Partners] Error:', error);
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch partners', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
