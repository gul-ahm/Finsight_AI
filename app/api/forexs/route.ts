import { NextResponse } from 'next/server';
import { fetchForexQuote } from "@/backend/alphaVantage";

// Interface for ForexPair to improve type safety
interface ForexPair {
  symbol: string;
  name: string;
  exchange: string;
  status: string;
  base_currency: string;
  quote_currency: string;
}

// In-memory cache
const cache = new Map<string, { data: { pairs: ForexPair[]; totalCount: number }; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function GET(request: Request) {

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '50', 10);
  const currencyGroup = searchParams.get('currencyGroup') || 'All';
  const searchQuery = searchParams.get('searchQuery') || '';

  console.log("Request Parameters:", { page, perPage, currencyGroup, searchQuery });

  // Check cache
  const cacheKey = `forex_pairs_page_${page}_perPage_${perPage}_currencyGroup_${currencyGroup}_search_${searchQuery}`;
  const cachedData = cache.get(cacheKey);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log("Returning cached data for key:", cacheKey);
    return NextResponse.json(cachedData.data);
  }

  try {
    // Provide curated common FX pairs for listing (Alpha Vantage does not expose a full pairs list)
    let forexPairs: ForexPair[] = [
      { symbol: 'EUR/USD', name: 'Euro to US Dollar', exchange: 'FOREX', status: 'Major', base_currency: 'EUR', quote_currency: 'USD' },
      { symbol: 'GBP/USD', name: 'British Pound to US Dollar', exchange: 'FOREX', status: 'Major', base_currency: 'GBP', quote_currency: 'USD' },
      { symbol: 'USD/JPY', name: 'US Dollar to Japanese Yen', exchange: 'FOREX', status: 'Major', base_currency: 'USD', quote_currency: 'JPY' },
      { symbol: 'AUD/USD', name: 'Australian Dollar to US Dollar', exchange: 'FOREX', status: 'Major', base_currency: 'AUD', quote_currency: 'USD' },
      { symbol: 'USD/CAD', name: 'US Dollar to Canadian Dollar', exchange: 'FOREX', status: 'Major', base_currency: 'USD', quote_currency: 'CAD' },
      { symbol: 'USD/CHF', name: 'US Dollar to Swiss Franc', exchange: 'FOREX', status: 'Major', base_currency: 'USD', quote_currency: 'CHF' },
      { symbol: 'NZD/USD', name: 'New Zealand Dollar to US Dollar', exchange: 'FOREX', status: 'Major', base_currency: 'NZD', quote_currency: 'USD' },
      { symbol: 'EUR/GBP', name: 'Euro to British Pound', exchange: 'FOREX', status: 'Cross', base_currency: 'EUR', quote_currency: 'GBP' },
      { symbol: 'EUR/JPY', name: 'Euro to Japanese Yen', exchange: 'FOREX', status: 'Cross', base_currency: 'EUR', quote_currency: 'JPY' },
      { symbol: 'GBP/JPY', name: 'British Pound to Japanese Yen', exchange: 'FOREX', status: 'Cross', base_currency: 'GBP', quote_currency: 'JPY' },
    ];
    console.log("Mapped Forex Pairs (before filtering):", forexPairs.length, "pairs");

    // Use Array.from instead of spread operator to avoid downlevel iteration issue
    const availableCurrencyGroups = Array.from(new Set(forexPairs.map((pair) => pair.status)));
    console.log("Available Currency Groups:", availableCurrencyGroups);

    // Apply filters server-side
    if (searchQuery.trim() !== '') {
      const lowerQuery = searchQuery.toLowerCase();
      forexPairs = forexPairs.filter((pair) =>
        pair.symbol.toLowerCase().includes(lowerQuery) ||
        pair.name.toLowerCase().includes(lowerQuery) ||
        (pair.base_currency && pair.base_currency.toLowerCase().includes(lowerQuery)) ||
        (pair.quote_currency && pair.quote_currency.toLowerCase().includes(lowerQuery))
      );
      console.log("After searchQuery filter:", forexPairs.length, "pairs");
    }

    if (currencyGroup !== "All") {
      forexPairs = forexPairs.filter((pair) => pair.status === currencyGroup);
      console.log("After currencyGroup filter:", forexPairs.length, "pairs");
    }

    // Apply pagination server-side
    const totalCount = forexPairs.length;
    const start = (page - 1) * perPage;
    const paginatedPairs = forexPairs.slice(start, start + perPage);
    console.log("After pagination:", paginatedPairs.length, "pairs (total:", totalCount, ")");

    // Cache the result
    const responseData = {
      pairs: paginatedPairs,
      totalCount: totalCount,
    };
    cache.set(cacheKey, { data: responseData, timestamp: now });
    console.log("Cached response for key:", cacheKey);

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching forex pairs:", errorMessage);
    return NextResponse.json({ pairs: [], totalCount: 0 }, { status: 200 });
  }
}
