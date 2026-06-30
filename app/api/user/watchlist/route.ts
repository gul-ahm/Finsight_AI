import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/backend/db';
import { requireAuth } from '@/backend/middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const session = authResult.session;
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch favorites and map to a simple string array to match legacy API response
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.user.email as string }, // Linked via email in schema
      select: { symbol: true }
    });

    return NextResponse.json({ watchlist: favorites.map(f => f.symbol) });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const session = authResult.session;
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { symbol } = await request.json();
    if (!symbol) return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });

    // Using upsert or create-if-not-exists logic manually to avoid errors
    // Since we have @@unique([userId, symbol]), create might fail if exists
    try {
      await prisma.userFavorite.create({
        data: {
          userId: session.user.email,
          symbol: symbol
        }
      });
    } catch (e: unknown) {
      // Ignore unique constraint violation (P2002) - treat as "already added"
      // We need to import Prisma to check the error instance properly, but for now checking 'code' property safely
      if (typeof e === 'object' && e !== null && 'code' in e && (e as any).code === 'P2002') {
        // Already exists, ignore
      } else {
        throw e;
      }
    }

    // Return updated list
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.user.email },
      select: { symbol: true }
    });

    return NextResponse.json({ watchlist: favorites.map(f => f.symbol) });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
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

    await prisma.userFavorite.deleteMany({
      where: {
        userId: session.user.email,
        symbol: symbol
      }
    });

    // Return updated list
    const favorites = await prisma.userFavorite.findMany({
      where: { userId: session.user.email },
      select: { symbol: true }
    });

    return NextResponse.json({ watchlist: favorites.map(f => f.symbol) });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
