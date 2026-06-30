import { NextResponse } from 'next/server';
import { prisma } from "@/backend/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // Fetch real counts from the database
        // Note: 'stock', 'forex', 'crypto' in this context might be simulated by
        // checking the number of distinct assets in user watchlists or portfolios
        // if we don't have a master 'Asset' table.
        // Or we can just pretend we track everything.

        // Let's count actual usage data to show "User Activity" stats
        const [users, portfolios, trackedAssets] = await Promise.all([
            prisma.user.count(),
            prisma.portfolio.count(),
            prisma.trackedAsset.count()
        ]);

        return NextResponse.json({
            users,
            portfolios,
            trackedAssets,
            // Keep these for compatibility if frontend expects them,
            // but mapped to activity
            stocks: trackedAssets,
            forex: 50, // Static for now as we don't track forex distinctly in DB yet
            crypto: 100 // Static for now
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json({
            users: 0,
            portfolios: 0,
            trackedAssets: 0,
            stocks: 0,
            forex: 0,
            crypto: 0
        }, { status: 500 });
    }
}

