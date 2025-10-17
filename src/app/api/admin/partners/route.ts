import { NextRequest, NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/database';
import { partners, collections, documents } from '@/lib/database/schema';
import { hashPassword } from '@/lib/auth/password';
import { requireRole } from '@/lib/auth/middleware';
import type { Partner, PartnerWithStats } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole('admin');

    // Get partners with collection and document counts
    const result = await db.query.partners.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
        status: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        collections: {
          columns: {
            id: true,
          },
        },
        documents: {
          columns: {
            id: true,
          },
        },
      },
    });

    // Transform results to include counts
    const partnersWithStats: PartnerWithStats[] = result.map(partner => ({
      id: partner.id,
      email: partner.email,
      role: partner.role,
      status: partner.status,
      name: partner.name,
      collectionsCount: partner.collections?.length || 0,
      documentsCount: partner.documents?.length || 0,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    }));

    return NextResponse.json(partnersWithStats);
  } catch (error) {
    console.error('[Admin] GET partners error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin role
    await requireRole('admin');

    const body = await request.json();
    const { id, email, password, role = 'partner' } = body;

    // Validate required fields
    if (!id || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate partner ID format
    if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid partner ID format' },
        { status: 400 }
      );
    }

    // Check if partner ID already exists
    const existing = await db.query.partners.findFirst({
      where: eq(partners.id, id),
      columns: {
        id: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Partner ID already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create partner
    await db.insert(partners).values({
      id,
      email,
      password: hashedPassword,
      role: role as Partner['role'],
      status: 'active',
      createdAt: sql`CURRENT_TIMESTAMP`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[Admin] POST partner error:', error);
    return NextResponse.json(
      { error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
