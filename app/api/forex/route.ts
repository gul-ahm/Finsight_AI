import { NextResponse } from 'next/server';

import { fetchTwelveDataForex, RateLimitError } from "../_twelvedata";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// In-memory cache for forex data (symbol -> forex data)
const forexCache = new Map();
// Robust aggressive cache: 2 minutes (120 seconds) to prevent hitting limits
const CACHE_DURATION = 120 * 1000; 

export async function GET(request: Request) {
  const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
  if (!apiKey) {
    console.error("TWELVEDATA_API_KEY is not set in environment variables");
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = symbol.toUpperCase();
  const cachedData = forexCache.get(cacheKey);
  const now = Date.now();
  
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log(`[Cache Hit] Returning cached forex data for symbol: ${symbol} (Source: ${cachedData.source})`);
    return NextResponse.json(cachedData.data);
  }

  try {
    let forexData;
    let dataSource = "TwelveData";

    console.log(`[Fetch] Attempting to fetch real-time data from TwelveData for ${symbol}...`);
    try {
      forexData = await fetchTwelveDataForex(symbol);
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.error(`[Rate Limit] TwelveData limit hit for ${symbol}. Please wait and try again later.`);
        throw new Error("API rate limit exceeded. Please try again in a minute.");
      } else {
        throw error;
      }
    }

    // Cache the result aggressively
    forexCache.set(cacheKey, { data: forexData, timestamp: now, source: dataSource });
    console.log(`[Success] Fetched and cached forex data for symbol: ${symbol} from ${dataSource}`);

    return NextResponse.json(forexData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Error] Failed completely fetching forex data for symbol ${symbol}:`, errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch forex data: " + errorMessage },
      { status: 500 }
    );
  }
}
