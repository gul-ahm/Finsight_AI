import { NextResponse } from 'next/server';
import { fetchStockQuote } from '@/backend/alphaVantage';

// Force dynamic rendering
export const dynamic = "force-dynamic";

// Interface for Stock to improve type safety
interface Stock {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  country: string;
  status: string;
  price?: string;
  change?: string;
  percent_change?: string;
  volume?: string;
}

// In-memory cache for stock listings
let cachedStocks: Stock[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  // If a specific symbol is requested, return quote via Alpha Vantage
  if (symbol) {
    try {
      const quote = await fetchStockQuote(symbol);
      return NextResponse.json(quote);
    } catch (error: any) {
      return NextResponse.json(
        { error: error?.message || 'Failed to fetch stock quote' },
        { status: error?.message?.includes('ALPHA_VANTAGE_API_KEY') ? 400 : 502 }
      );
    }
  }

  console.log("Fetching stock listings (popular symbols)...");

  // Check if cache is valid
  const now = Date.now();
  if (cachedStocks && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
    console.log("Returning cached stock listings...");
    return NextResponse.json(cachedStocks);
  }

  // Provide a curated list of popular US stocks for listing (limited to 7 to fit Twelve Data free rate-limit credit usage)
  const stocks: Stock[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD', exchange: 'NASDAQ', country: 'USA', status: 'Common Stock' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', currency: 'USD', exchange: 'NASDAQ', country: 'USA', status: 'Common Stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc. (Class A)', currency: 'USD', exchange: 'NASDAQ', country: 'USA', status: 'Common Stock' },
    { symbol: 'AMZN', name: 'Amazon.com, Inc.', currency: 'USD', exchange: 'NASDAQ', country: 'USA', status: 'Common Stock' },
    { symbol: 'META', name: 'Meta Platforms, Inc.', currency: 'USD', exchange: 'NASDAQ', country: 'USA', status: 'Common Stock' },
    { symbol: 'TSLA', name: 'Tesla, Inc.', currency: 'USD', exchange: 'NASDAQ', country: 'USA', status: 'Common Stock' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', currency: 'USD', exchange: 'NASDAQ', country: 'USA', status: 'Common Stock' },
  ];

  // Try fetching batch quotes from Twelve Data to populate real-time values
  const TWELVE_DATA_API_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY || process.env.TWELVE_DATA_API_KEY;
  if (TWELVE_DATA_API_KEY) {
    try {
      const symbolsStr = stocks.map(s => s.symbol).join(',');
      const url = `https://api.twelvedata.com/quote?symbol=${symbolsStr}&apikey=${TWELVE_DATA_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const quotes = await res.json();
        stocks.forEach(stock => {
          const quote = quotes[stock.symbol];
          if (quote) {
            stock.price = quote.close || quote.price || undefined;
            stock.change = quote.change || undefined;
            stock.percent_change = quote.percent_change || undefined;
            stock.volume = quote.volume || undefined;
          }
        });
      }
    } catch (err) {
      console.warn("Failed to fetch batch quotes from Twelve Data:", err);
    }
  }

  const searchQuery = searchParams.get('search')?.toLowerCase();

  if (searchQuery) {
    const filteredStocks = stocks.filter(s =>
      s.symbol.toLowerCase().includes(searchQuery) ||
      s.name.toLowerCase().includes(searchQuery)
    );
    // Mimic the { data: [] } structure expected by SymbolSearch
    return NextResponse.json({ data: filteredStocks });
  }

  if (stocks.length === 0) {
    return NextResponse.json([], { status: 200 });
  }

  // Update cache
  cachedStocks = stocks;
  cacheTimestamp = Date.now();
  console.log("Stock listings (curated) cached successfully");

  return NextResponse.json(stocks);
}
