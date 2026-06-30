import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/backend/db';
import { withRateLimit, errorResponse } from '@/backend/api-middleware';
import { RATE_LIMITS } from '@/backend/rate-limiter';

/**
 * POST /api/portfolio/[id]/holdings
 * Add a new holding to the portfolio
 */
async function addHolding(
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
    const { symbol, assetType, quantity, purchasePrice, purchaseDate, notes } = body;

    // Validation
    if (!symbol || !assetType || !quantity || !purchasePrice) {
      return errorResponse('Missing required fields', 400);
    }

    if (!['stock', 'crypto', 'forex'].includes(assetType)) {
      return errorResponse('Invalid asset type', 400);
    }

    if (quantity <= 0 || purchasePrice <= 0) {
      return errorResponse('Quantity and price must be positive', 400);
    }

    // Check portfolio ownership
    const portfolio = await prisma.portfolio.findFirst({
      where: { id: id, userId: session.user.email }
    });

    if (!portfolio) {
      return errorResponse('Portfolio not found', 404);
    }

    await prisma.holding.create({
      data: {
        portfolioId: id,
        symbol: symbol.toUpperCase(),
        assetType,
        quantity: Number(quantity),
        purchasePrice: Number(purchasePrice),
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        notes: notes || '',
      }
    });

    // Return full portfolio with updated holdings to match Mongoose response structure
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      include: { holdings: { orderBy: { createdAt: 'asc' } } } // Maintain insertion order
    });

    return NextResponse.json(updatedPortfolio, { status: 201 });
  } catch (error) {
    console.error('Error adding holding:', error);
    return errorResponse('Failed to add holding', 500);
  }
}

/**
 * PUT /api/portfolio/[id]/holdings
 * Update a holding in the portfolio
 */
async function updateHolding(
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
    const { holdingIndex, quantity, purchasePrice, notes } = body;

    if (holdingIndex === undefined) {
      return errorResponse('Holding index is required', 400);
    }

    // Check proper ownership and get ALL holdings to find by index
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      include: { holdings: { orderBy: { createdAt: 'asc' } } }
    });

    if (!portfolio || portfolio.userId !== session.user.email) {
      return errorResponse('Portfolio not found', 404);
    }

    // Find holding by index
    const holdingToUpdate = portfolio.holdings[Number(holdingIndex)];

    if (!holdingToUpdate) {
      return errorResponse('Holding not found at index', 404);
    }

    await prisma.holding.update({
      where: { id: holdingToUpdate.id },
      data: {
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        ...(purchasePrice !== undefined && { purchasePrice: Number(purchasePrice) }),
        ...(notes !== undefined && { notes: notes }),
      }
    });

    // Return updated portfolio
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      include: { holdings: { orderBy: { createdAt: 'asc' } } }
    });

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error('Error updating holding:', error);
    return errorResponse('Failed to update holding', 500);
  }
}

/**
 * DELETE /api/portfolio/[id]/holdings
 * Remove a holding from the portfolio
 */
async function deleteHolding(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const holdingIndex = searchParams.get('index');

    if (holdingIndex === null) {
      return errorResponse('Holding index is required', 400);
    }

    // Check ownership and get holdings
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      include: { holdings: { orderBy: { createdAt: 'asc' } } }
    });

    if (!portfolio || portfolio.userId !== session.user.email) {
      return errorResponse('Portfolio not found', 404);
    }

    const holdingToDelete = portfolio.holdings[Number(holdingIndex)];

    if (!holdingToDelete) {
      return errorResponse('Holding not found at index', 404);
    }

    await prisma.holding.delete({
      where: { id: holdingToDelete.id }
    });

    // Return updated portfolio
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      include: { holdings: { orderBy: { createdAt: 'asc' } } }
    });

    // The legacy code returned the portfolio logic slightly differently (array splice),
    // but returning the fresh object is safest.
    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error('Error deleting holding:', error);
    return errorResponse('Failed to delete holding', 500);
  }
}

export const POST = withRateLimit(addHolding, RATE_LIMITS.API_DEFAULT);
export const PUT = withRateLimit(updateHolding, RATE_LIMITS.API_DEFAULT);
export const DELETE = withRateLimit(deleteHolding, RATE_LIMITS.API_DEFAULT);

