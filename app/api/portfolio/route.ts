import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth';
import { prisma } from '@/backend/db';
import { withRateLimit, errorResponse } from '@/backend/api-middleware';
import { RATE_LIMITS } from '@/backend/rate-limiter';
import { PortfolioSchema } from '@/backend/validators';

/**
 * GET /api/portfolio
 * Get all portfolios for the authenticated user
 */
async function getPortfolios(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const portfolios = await prisma.portfolio.findMany({
      where: {
        userId: session.user.email
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        holdings: true // Include holdings to calculate value on frontend logic
      }
    });

    return NextResponse.json(portfolios);
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return errorResponse('Failed to fetch portfolios', 500);
  }
}

/**
 * POST /api/portfolio
 * Create a new portfolio
 */
async function createPortfolio(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await request.json();

    const result = PortfolioSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Invalid input', 400);
    }

    const { name, description } = result.data;

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: session.user.email,
        name: name.trim(),
        description: description?.trim() || '',
        // holdings relation starts empty by default
      },
      include: {
        holdings: true
      }
    });

    return NextResponse.json(portfolio, { status: 201 });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    return errorResponse('Failed to create portfolio', 500);
  }
}

export const GET = withRateLimit(getPortfolios, RATE_LIMITS.API_DEFAULT);
export const POST = withRateLimit(createPortfolio, RATE_LIMITS.API_DEFAULT);


