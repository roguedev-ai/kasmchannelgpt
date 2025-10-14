import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { db } from '../../../../lib/database/client';
import { ValidationError } from '../../../../types/backend';

export async function POST(request: NextRequest) {
  try {
    // Get credentials
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }
    
    // For now, just create a mock user
    const user = {
      id: `user_${Date.now()}`,
      partner_id: 'demo',
      email: email,
      name: email.split('@')[0],
    };
    
    // Generate JWT token
    const token = partnerContext.createToken(user.partner_id, user.email);
    
    // Return session info
    return NextResponse.json({
      token,
      partnerId: user.partner_id,
      expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
    });
    
  } catch (error: any) {
    console.error('[Login] Error:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Login failed', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
