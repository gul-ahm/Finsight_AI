import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// In-memory cache for cryptocurrency pairs list
const cryptoCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Utility function to fetch with retry on rate limit
async function fetchWithRetry(url: string, maxRetries: number = 3, retryDelayMs: number = 10000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          console.warn(`Rate limit hit for URL: ${url}. Retrying (${attempt}/${maxRetries}) after ${retryDelayMs}ms...`);
          if (attempt === maxRetries) {
            throw new Error("Rate limit exceeded after maximum retries");
          }
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
          continue;
        }
        throw new Error(`API error: ${JSON.stringify(errorData)}`);
      }
      return await response.json();
    } catch (error: unknown) {
      if (attempt === maxRetries) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Fetch attempt ${attempt} failed for URL: ${url}. Retrying after ${retryDelayMs}ms...`, errorMessage);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  throw new Error("Unexpected error in fetchWithRetry");
}

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  // Check cache for the full list of cryptocurrencies
  const cacheKey = "crypto_list";
  const cachedData = cryptoCache.get(cacheKey);
  const now = Date.now();

  let cryptoPairs: Array<{
    symbol: string;
    available_exchanges: string[];
    currency_base: string;
    currency_quote: string;
  }> = [];

  // Fetch the list if not in cache or cache is expired
  if (!cachedData || now - cachedData.timestamp > CACHE_DURATION) {
    try {
      const url = `https://api.binance.com/api/v3/exchangeInfo`;
      console.log("Fetching cryptocurrency pairs from Binance exchangeInfo...");
      const data = await fetchWithRetry(url);

      const symbols: Array<{
        symbol: string;
        baseAsset: string;
        quoteAsset: string;
        status?: string;
      }> = Array.isArray(data?.symbols) ? data.symbols : [];
      if (!symbols.length) {
        throw new Error("Binance exchangeInfo returned no symbols");
      }

      // Map to unified pair shape and filter trading symbols
      const seen = new Set<string>();
      cryptoPairs = symbols
        .filter((s) => (s.status || "TRADING") === "TRADING")
        .map((s) => ({
          symbol: s.symbol,
          available_exchanges: ["Binance"],
          currency_base: s.baseAsset,
          currency_quote: s.quoteAsset,
        }))
        .filter((p) => {
          if (seen.has(p.symbol)) return false;
          seen.add(p.symbol);
          return true;
        });

      cryptoCache.set(cacheKey, { data: cryptoPairs, timestamp: now });
      console.log(`Cached ${cryptoPairs.length} Binance trading pairs`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error fetching cryptocurrency pairs:", errorMessage);
      return NextResponse.json(
        { error: "Failed to fetch cryptocurrency pairs: " + errorMessage },
        { status: 502 }
      );
    }
  } else {
    console.log("Returning cached cryptocurrency pairs");
    cryptoPairs = cachedData.data;
  }

  // If a symbol is provided, validate it and return its details
  if (symbol) {
    const upperSymbol = symbol.toUpperCase();
    const pair = cryptoPairs.find((p) => p.symbol.toUpperCase() === upperSymbol);
    if (!pair) {
      return NextResponse.json(
        { error: `Cryptocurrency pair ${symbol} is not supported` },
        { status: 404 }
      );
    }

    // Fetch real-time price for the symbol via Binance
    try {
      const priceUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${upperSymbol}`;
      console.log(`Fetching real-time 24h ticker for symbol: ${upperSymbol} from Binance...`);
      const ticker = await fetchWithRetry(priceUrl);

      // Normalize fields
      const price = Number(ticker?.lastPrice ?? ticker?.price ?? NaN);
      const percent = Number(ticker?.priceChangePercent ?? NaN);

      return NextResponse.json({
        symbol: pair.symbol,
        currency_base: pair.currency_base,
        currency_quote: pair.currency_quote,
        available_exchanges: pair.available_exchanges,
        price,
        percent_change: percent,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching real-time data for symbol ${upperSymbol}:`, errorMessage);
      return NextResponse.json(
        { error: `Failed to fetch real-time data for ${upperSymbol}: ${errorMessage}` },
        { status: 502 }
      );
    }
  }

  // If no symbol is provided, return the full list of cryptocurrency pairs
  return NextResponse.json(cryptoPairs);
}
