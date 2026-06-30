import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/backend/db';
import { withRateLimit, errorResponse } from '@/backend/api-middleware';
import { RATE_LIMITS } from '@/backend/rate-limiter';

/**
 * GET /api/watchlist/[id]
 * Get a specific watchlist
 */
async function getWatchlist(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const watchlist = await prisma.watchlist.findFirst({
      where: { id: id, userId: session.user.email },
      include: { assets: true }
    });

    if (!watchlist) {
      return errorResponse('Watchlist not found', 404);
    }

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return errorResponse('Failed to fetch watchlist', 500);
  }
}

/**
 * PUT /api/watchlist/[id]
 * Update watchlist name
 */
async function updateWatchlist(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return errorResponse('Name is required', 400);
    }

    const existing = await prisma.watchlist.findFirst({
      where: { id: id, userId: session.user.email }
    });

    if (!existing) return errorResponse('Watchlist not found', 404);

    const watchlist = await prisma.watchlist.update({
      where: { id: id },
      data: { name: name.trim() },
      include: { assets: true }
    });

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error updating watchlist:', error);
    return errorResponse('Failed to update watchlist', 500);
  }
}

/**
 * DELETE /api/watchlist/[id]
 * Delete a watchlist
 */
async function deleteWatchlist(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const existing = await prisma.watchlist.findFirst({
      where: { id: id, userId: session.user.email }
    });

    if (!existing) return errorResponse('Watchlist not found', 404);

    await prisma.watchlist.delete({ where: { id: id } });

    return NextResponse.json({ message: 'Watchlist deleted successfully' });
  } catch (error) {
    console.error('Error deleting watchlist:', error);
    return errorResponse('Failed to delete watchlist', 500);
  }
}

/**
 * POST /api/watchlist/[id]
 * Add asset to watchlist
 */
async function addAsset(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const body = await request.json();
    const { symbol, assetType, notes, alertPrice } = body;

    if (!symbol || !assetType) {
      return errorResponse('Symbol and asset type are required', 400);
    }

    if (!['stock', 'crypto', 'forex'].includes(assetType)) {
      return errorResponse('Invalid asset type', 400);
    }

    const existing = await prisma.watchlist.findFirst({
      where: { id: id, userId: session.user.email }
    });

    if (!existing) return errorResponse('Watchlist not found', 404);

    await prisma.watchlistItem.create({
      data: {
        watchlistId: id,
        symbol: symbol.toUpperCase(),
        assetType,
        notes: notes || '',
        alertPrice: alertPrice ? Number(alertPrice) : undefined
      }
    });

    // Return full watchlist
    const watchlist = await prisma.watchlist.findUnique({
      where: { id: id },
      include: { assets: true }
    });

    return NextResponse.json(watchlist);
  } catch (error) {
    console.error('Error adding asset:', error);
    return errorResponse('Failed to add asset', 500);
  }
}

export const GET = withRateLimit(getWatchlist, RATE_LIMITS.API_DEFAULT);
export const PUT = withRateLimit(updateWatchlist, RATE_LIMITS.API_DEFAULT);
export const DELETE = withRateLimit(deleteWatchlist, RATE_LIMITS.API_DEFAULT);
export const POST = withRateLimit(addAsset, RATE_LIMITS.API_DEFAULT);

