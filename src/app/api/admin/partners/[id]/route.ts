import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/database';
import { partners, collections, documents } from '@/lib/database/schema';
import { hashPassword } from '@/lib/auth/password';
import { requireRole } from '@/lib/auth/middleware';

interface RouteContext {
  params: {
    id: string;
  };
}

// GET single partner with detailed stats
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Verify admin role
    await requireRole('admin');

    const partnerId = params.id;

    // Get partner with all related data
    const partner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
      with: {
        collections: {
          with: {
            documents: true,
            settings: true,
          },
        },
        documents: true,
      },
    });

    if (!partner) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const stats = {
      id: partner.id,
      email: partner.email,
      name: partner.name,
      role: partner.role,
      status: partner.status,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      collectionsCount: partner.collections?.length || 0,
      documentsCount: partner.documents?.length || 0,
      collections: partner.collections?.map(col => ({
        id: col.id,
        name: col.name,
        description: col.description,
        documentsCount: col.documents?.length || 0,
        qdrantCollection: col.qdrantCollection,
        useRagByDefault: col.useRagByDefault,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Admin] GET partner error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch partner' },
      { status: 500 }
    );
  }
}

// PATCH update partner
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Verify admin role
    await requireRole('admin');

    const partnerId = params.id;
    const body = await request.json();

    // Validate partner exists
    const existing = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
      columns: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.email !== undefined) updateData.email = body.email;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.role !== undefined) updateData.role = body.role;
    
    // If password is being updated, hash it
    if (body.password) {
      updateData.password = await hashPassword(body.password);
    }

    // Update partner
    await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, partnerId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin] PATCH partner error:', error);
    return NextResponse.json(
      { error: 'Failed to update partner' },
      { status: 500 }
    );
  }
}

// DELETE partner
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Verify admin role
    await requireRole('admin');

    const partnerId = params.id;

    // Verify partner exists
    const existing = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
      columns: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    // Delete partner (cascade will handle collections and documents)
    await db
      .delete(partners)
      .where(eq(partners.id, partnerId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin] DELETE partner error:', error);
    return NextResponse.json(
      { error: 'Failed to delete partner' },
      { status: 500 }
    );
  }
}
