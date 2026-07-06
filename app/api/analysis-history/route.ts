import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId = null;

    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        userId = user.email; // Schema uses email as foreign key reference
      }
    }

    const body = await req.json();
    const { symbol, assetType, dataSnapshot, analysis } = body;

    if (!symbol || !assetType || !analysis) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const history = await prisma.analysisHistory.create({
      data: {
        userId,
        symbol,
        assetType,
        dataSnapshot,
        analysis,
      },
    });

    return NextResponse.json({ success: true, history }, { status: 201 });
  } catch (error) {
    console.error('Error saving analysis history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const assetType = searchParams.get('assetType');

    const whereClause: any = { userId: user.id };
    if (symbol) whereClause.symbol = symbol;
    if (assetType) whereClause.assetType = assetType;

    const history = await prisma.analysisHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
