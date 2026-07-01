import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth';
import { prisma } from '@/backend/db';
import { withRateLimit, errorResponse } from '@/backend/api-middleware';
import { RATE_LIMITS } from '@/backend/rate-limiter';
import { WatchlistSchema } from '@/backend/validators';

/**
 * GET /api/watchlist
 * Get all watchlists for the authenticated user
 */
async function getWatchlists(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const watchlists = await prisma.watchlist.findMany({
      where: {
        userId: session.user.email
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        assets: true
      }
    });

    return NextResponse.json(watchlists);
  } catch (error) {
    console.error('Error fetching watchlists:', error);
    return errorResponse('Failed to fetch watchlists', 500);
  }
}

/**
 * POST /api/watchlist
 * Create a new watchlist
 */
async function createWatchlist(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    const result = WatchlistSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Invalid input', 400);
    }

    const { name } = result.data;

    const watchlist = await prisma.watchlist.create({
      data: {
        userId: session.user.email,
        name: name.trim(),
        // assets relation empty by default
      },
      include: {
        assets: true
      }
    });

    return NextResponse.json(watchlist, { status: 201 });
  } catch (error) {
    console.error('Error creating watchlist:', error);
    return errorResponse('Failed to create watchlist', 500);
  }
}

export const GET = withRateLimit(getWatchlists, RATE_LIMITS.API_DEFAULT);
export const POST = withRateLimit(createWatchlist, RATE_LIMITS.API_DEFAULT);


