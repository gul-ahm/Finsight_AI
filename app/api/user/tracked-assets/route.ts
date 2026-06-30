import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { requireAuth } from '@/backend/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const session = authResult.session;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch tracked assets from separate table
    const assets = await prisma.trackedAsset.findMany({
      where: { userId: session.user.email as string },
      orderBy: { addedAt: 'desc' }
    });

    return NextResponse.json({ trackedAssets: assets });
  } catch (error) {
    console.error('Error fetching tracked assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const session = authResult.session;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, symbol } = await request.json();
    if (!type || !symbol) return NextResponse.json({ error: 'Type and symbol are required' }, { status: 400 });

    // Add to tracked assets table (ignore duplicates manually or create simplified upsert)
    // To mimic $addToSet, we check if exists first
    const existing = await prisma.trackedAsset.findFirst({
      where: {
        userId: session.user.email,
        symbol: symbol,
        type: type
      }
    });

    if (!existing) {
      await prisma.trackedAsset.create({
        data: {
          userId: session.user.email,
          symbol,
          type
        }
      });
    }

    // Return updated list
    const assets = await prisma.trackedAsset.findMany({
      where: { userId: session.user.email },
      orderBy: { addedAt: 'desc' }
    });

    return NextResponse.json({ trackedAssets: assets });
  } catch (error) {
    console.error('Error adding tracked asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const session = authResult.session;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });

    await prisma.trackedAsset.deleteMany({
      where: {
        userId: session.user.email,
        symbol: symbol
      }
    });

    // Return updated list
    const assets = await prisma.trackedAsset.findMany({
      where: { userId: session.user.email },
      orderBy: { addedAt: 'desc' }
    });

    return NextResponse.json({ trackedAssets: assets });
  } catch (error) {
    console.error('Error removing tracked asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
