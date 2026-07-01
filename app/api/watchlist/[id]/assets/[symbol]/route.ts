import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth';
import { prisma } from '@/backend/db';
import { withRateLimit, errorResponse } from '@/backend/api-middleware';
import { RATE_LIMITS } from '@/backend/rate-limiter';

/**
 * DELETE /api/watchlist/[id]/assets/[symbol]
 * Remove a specific asset from a watchlist
 */
async function deleteAsset(
  request: Request,
  { params }: { params: Promise<{ id: string; symbol: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id, symbol } = await params;

    const existing = await prisma.watchlist.findFirst({
      where: { id: id, userId: session.user.email }
    });

    if (!existing) return errorResponse('Watchlist not found', 404);

    // Remove the asset from the watchlist
    await prisma.watchlistItem.deleteMany({
      where: {
        watchlistId: id,
        symbol: symbol.toUpperCase()
      }
    });

    // Return updated watchlist
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: id },
      include: { assets: true }
    });

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error removing asset:', error);
    return errorResponse('Failed to remove asset', 500);
  }
}

export const DELETE = withRateLimit(deleteAsset, RATE_LIMITS.API_DEFAULT);
