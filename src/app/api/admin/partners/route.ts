import { NextRequest, NextResponse } from 'next/server';
import { partnerContext } from '../../../../lib/isolation/partner-context';
import { db } from '../../../../lib/database/client';
import { AuthenticationError } from '../../../../types/backend';

// List all partners (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { user } = partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );
    
    // Check admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const partners = db.listUsers('partner');
    
    // Remove sensitive data
    const safePartners = partners.map(p => ({
      id: p.id,
      partnerId: p.partner_id,
      email: p.email,
      displayName: p.display_name,
      createdAt: p.created_at,
      lastLogin: p.last_login,
      isActive: p.is_active,
    }));
    
    return NextResponse.json({ partners: safePartners });
    
  } catch (error: any) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to list partners', message: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// Create new partner (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const { user: adminUser } = partnerContext.verifyTokenWithDatabase(
      authHeader?.replace('Bearer ', '') || ''
    );
    
    if (adminUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { partnerId, email, password, displayName } = body;
    
    if (!partnerId || !email || !password) {
      return NextResponse.json(
        { error: 'Partner ID, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Create partner
    const newPartner = await db.createUser({
      partnerId,
      email,
      password,
      role: 'partner',
      displayName,
    });
    
    // Log audit
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    db.logAudit(
      adminUser.id,
      'CREATE_PARTNER',
      'partners',
      { partnerId, email },
      ip
    );
    
    console.log(`[API] Partner created by admin: ${email}`);
    
    return NextResponse.json({
      success: true,
      partner: {
        id: newPartner.id,
        partnerId: newPartner.partner_id,
        email: newPartner.email,
        displayName: newPartner.display_name,
      },
    });
    
  } catch (error: any) {
    console.error('[API] Partner creation error:', error);
    
    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create partner', message: error?.message || 'Unknown error' },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
