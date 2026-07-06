import { NextResponse } from 'next/server';
import { prisma } from '@/backend/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const start = Date.now();
    const checks: Record<string, string> = {
        database: 'PENDING',
        google: 'PENDING',
        groqKey: 'PENDING',
        twelveDataKey: 'PENDING',
    };

    // 1. Check Database (Prisma)
    try {
        await prisma.$queryRaw`SELECT 1`;
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

    // 3. Check Groq API Key
    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;
    if (!groqKey) {
        checks.groqKey = 'MISSING - chat will not work!';
    } else {
        checks.groqKey = `SET (starts with: ${groqKey.substring(0, 8)}...)`;
    }

    // 4. Check TwelveData API Key
    const twelveKey = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY || process.env.TWELVE_DATA_API_KEY;
    if (!twelveKey) {
        checks.twelveDataKey = 'MISSING - market data will not work!';
    } else {
        checks.twelveDataKey = `SET (starts with: ${twelveKey.substring(0, 8)}...)`;
    }

    const duration = Date.now() - start;
    const allCriticalOk = groqKey && twelveKey;

    return NextResponse.json({
        status: allCriticalOk ? 'HEALTHY' : 'DEGRADED',
        checks,
        envKeys: {
            NEXT_PUBLIC_GROQ_API_KEY: !!process.env.NEXT_PUBLIC_GROQ_API_KEY,
            GROQ_API_KEY: !!process.env.GROQ_API_KEY,
            NEXT_PUBLIC_TWELVEDATA_API_KEY: !!process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY,
            TWELVE_DATA_API_KEY: !!process.env.TWELVE_DATA_API_KEY,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
            NODE_ENV: process.env.NODE_ENV,
        },
        timestamp: new Date().toISOString(),
        latency: `${duration}ms`
    });
}

