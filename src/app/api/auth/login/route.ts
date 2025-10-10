import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { db } from '../../../../lib/database/client';
import { LoginResponse } from '../../../../types/backend';

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequestBody = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Login attempt for: ${email}`);
    
    // Authenticate user
    const user = await db.authenticateUser(email, password);
    
    if (!user) {
      console.log(`[API] Login failed: Invalid credentials`);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Log audit
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    db.logAudit(user.id, 'LOGIN', 'auth', { email }, ip);
    
    // Generate JWT token
    const token = partnerContext.createTokenFromUser(user);
    const namespace = partnerContext.computeNamespace(user.partner_id);
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const response: LoginResponse & { role: string } = {
      token,
      partnerId: user.partner_id,
      namespace,
      expiresAt: expiresAt.toISOString(),
      role: user.role,
    };
    
    console.log(`[API] Login successful: ${email} (${user.role})`);
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error: any) {
    console.error('[API] Login error:', error);
    
    return NextResponse.json(
      { error: 'Login failed', message: error?.message || 'Unknown error' },
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
