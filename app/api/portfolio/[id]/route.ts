import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/backend/db';
import { withRateLimit, errorResponse } from '@/backend/api-middleware';
import { RATE_LIMITS } from '@/backend/rate-limiter';

/**
 * GET /api/portfolio/[id]
 * Get a specific portfolio with current prices for P&L calculation
 */
async function getPortfolio(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    const portfolio = await prisma.portfolio.findFirst({
      where: {
        id: id,
        userId: session.user.email,
      },
      include: {
        holdings: true,
      }
    });

    if (!portfolio) {
      return errorResponse('Portfolio not found', 404);
    }

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return errorResponse('Failed to fetch portfolio', 500);
  }
}

/**
 * PUT /api/portfolio/[id]
 * Update portfolio details (name, description)
 */
async function updatePortfolio(
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
    const { name, description } = body;

    // Check ownership before updating
    const existing = await prisma.portfolio.findFirst({
      where: { id: id, userId: session.user.email }
    });

    if (!existing) {
      return errorResponse('Portfolio not found', 404);
    }

    const portfolio = await prisma.portfolio.update({
      where: { id: id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
      },
      include: { holdings: true }
    });

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Error updating portfolio:', error);
    return errorResponse('Failed to update portfolio', 500);
  }
}

/**
 * DELETE /api/portfolio/[id]
 * Delete a portfolio
 */
async function deletePortfolio(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = await params;

    // Check ownership before deleting
    const existing = await prisma.portfolio.findFirst({
      where: { id: id, userId: session.user.email }
    });

    if (!existing) {
      return errorResponse('Portfolio not found', 404);
    }

    await prisma.portfolio.delete({
      where: { id: id }
    });

    return NextResponse.json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    return errorResponse('Failed to delete portfolio', 500);
  }
}

export const GET = withRateLimit(getPortfolio, RATE_LIMITS.API_DEFAULT);
export const PUT = withRateLimit(updatePortfolio, RATE_LIMITS.API_DEFAULT);
export const DELETE = withRateLimit(deletePortfolio, RATE_LIMITS.API_DEFAULT);

