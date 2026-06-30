import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';

export async function GET() {
    const start = Date.now();
    const checks = {
        database: 'PENDING',
        google: 'PENDING',
        newsApi: 'PENDING',
    };

    // 1. Check Database (Prisma)
    try {
        await prisma.$queryRaw`SELECT 1`; // Lightweight query
        checks.database = 'CONNECTED';
    } catch (error) {
        console.error('Database Health Check Failed:', error);
        checks.database = 'FAILED';
    }

    // 2. Check Google Connectivity
    try {
        const google = await fetch('https://www.google.com', { method: 'HEAD' });
        checks.google = google.ok ? 'CONNECTED' : 'UNREACHABLE';
    } catch (error) {
        checks.google = 'FAILED';
    }

    // 3. Check NewsAPI Connectivity (using the Key)
    try {
        const apiKey = process.env.NEWSAPI_API_KEY || process.env.NEWS_API_KEY;
        if (!apiKey) {
            checks.newsApi = 'The API key is missing';
        } else {
            const news = await fetch(`https://newsapi.org/v2/top-headlines?country=us&pageSize=1&apiKey=${apiKey}`);
            checks.newsApi = news.ok ? 'CONNECTED' : `ERROR_${news.status}`;
        }
    } catch (error) {
        checks.newsApi = 'FAILED';
    }

    const duration = Date.now() - start;

    return NextResponse.json({
        status: Object.values(checks).every(s => s === 'CONNECTED') ? 'HEALTHY' : 'DEGRADED',
        checks,
        timestamp: new Date().toISOString(),
        latency: `${duration}ms`
    });
}

