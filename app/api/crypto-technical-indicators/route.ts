import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = "force-dynamic";

// In-memory cache for technical indicators data (symbol -> indicators data)
const indicatorsCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limit: 8 requests per minute (60 seconds / 8 = 7.5 seconds per request)
// We'll use 15 seconds to be safe (slightly reduced from 18 seconds to improve fetch time)
const REQUEST_DELAY_MS = 16000; // 15 seconds delay between requests

// Utility function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
          await delay(retryDelayMs);
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
      await delay(retryDelayMs);
    }
  }
  throw new Error("Unexpected error in fetchWithRetry");
}

export async function GET(request: Request) {
  const TWELVE_DATA_API_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
  if (!TWELVE_DATA_API_KEY) {
    console.error("TWELVE_DATA_API_KEY is not set in environment variables");
    return NextResponse.json(
      { error: "Server configuration error: API key missing" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "Symbol parameter is required" },
      { status: 400 }
    );
  }

  // Format symbol (e.g., LTCBTC -> LTC/BTC) to match Twelve Data's format requirements
  let formattedSymbol = symbol.toUpperCase();
  if (!formattedSymbol.includes("/")) {
    const quoteCurrencies = ["USDT", "USDC", "BUSD", "BTC", "ETH", "USD", "EUR", "GBP", "JPY"];
    for (const quote of quoteCurrencies) {
      if (formattedSymbol.endsWith(quote) && formattedSymbol !== quote) {
        const base = formattedSymbol.slice(0, -quote.length);
        formattedSymbol = `${base}/${quote}`;
        break;
      }
    }
  }

  // Check cache
  const cacheKey = formattedSymbol.toUpperCase();
  const cachedData = indicatorsCache.get(cacheKey);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Returning cached technical indicators for symbol: ${formattedSymbol}`);
    return NextResponse.json(cachedData.data);
  }

  try {
    // Initialize data objects
    let emaData = { ema20: null, ema50: null };
    let rsiData = null;
    let macdData = null;
    let bbandsData = null;
    let atrData = null;
    let obvData = null;
    let supertrendData = null;

    // Fetch 20-day EMA
    try {
      const ema20Url = `https://api.twelvedata.com/ema?symbol=${formattedSymbol}&interval=1day&time_period=20&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching 20-day EMA for symbol: ${formattedSymbol} from Twelve Data...`);
      const ema20ResponseData = await fetchWithRetry(ema20Url);
      emaData.ema20 = ema20ResponseData.values || null;
      console.log(`Successfully fetched 20-day EMA for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching 20-day EMA for symbol ${formattedSymbol}:`, errorMessage);
    }
    await delay(REQUEST_DELAY_MS);

    // Fetch 50-day EMA
    try {
      const ema50Url = `https://api.twelvedata.com/ema?symbol=${formattedSymbol}&interval=1day&time_period=50&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching 50-day EMA for symbol: ${formattedSymbol} from Twelve Data...`);
      const ema50ResponseData = await fetchWithRetry(ema50Url);
      emaData.ema50 = ema50ResponseData.values || null;
      console.log(`Successfully fetched 50-day EMA for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching 50-day EMA for symbol ${formattedSymbol}:`, errorMessage);
    }
    await delay(REQUEST_DELAY_MS);

    // Fetch RSI (14-day)
    try {
      const rsiUrl = `https://api.twelvedata.com/rsi?symbol=${formattedSymbol}&interval=1day&time_period=14&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching RSI for symbol: ${formattedSymbol} from Twelve Data...`);
      const rsiResponseData = await fetchWithRetry(rsiUrl);
      rsiData = rsiResponseData.values || null;
      console.log(`Successfully fetched RSI for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching RSI for symbol ${formattedSymbol}:`, errorMessage);
    }
    await delay(REQUEST_DELAY_MS);

    // Fetch MACD
    try {
      const macdUrl = `https://api.twelvedata.com/macd?symbol=${formattedSymbol}&interval=1day&fast_period=12&slow_period=26&signal_period=9&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching MACD for symbol: ${formattedSymbol} from Twelve Data...`);
      const macdResponseData = await fetchWithRetry(macdUrl);
      macdData = macdResponseData.values || null;
      console.log(`Successfully fetched MACD for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching MACD for symbol ${formattedSymbol}:`, errorMessage);
    }
    await delay(REQUEST_DELAY_MS);

    // Fetch BBANDS
    try {
      const bbandsUrl = `https://api.twelvedata.com/bbands?symbol=${formattedSymbol}&interval=1day&time_period=20&sd=2&ma_type=SMA&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching BBANDS for symbol: ${formattedSymbol} from Twelve Data...`);
      const bbandsResponseData = await fetchWithRetry(bbandsUrl);
      bbandsData = bbandsResponseData.values || null;
      console.log(`Successfully fetched BBANDS for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching BBANDS for symbol ${formattedSymbol}:`, errorMessage);
    }
    await delay(REQUEST_DELAY_MS);

    // Fetch ATR (14-day)
    try {
      const atrUrl = `https://api.twelvedata.com/atr?symbol=${formattedSymbol}&interval=1day&time_period=14&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching ATR for symbol: ${formattedSymbol} from Twelve Data...`);
      const atrResponseData = await fetchWithRetry(atrUrl);
      atrData = atrResponseData.values || null;
      console.log(`Successfully fetched ATR for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching ATR for symbol ${formattedSymbol}:`, errorMessage);
    }
    await delay(REQUEST_DELAY_MS);

    // Fetch OBV
    try {
      const obvUrl = `https://api.twelvedata.com/obv?symbol=${formattedSymbol}&interval=1day&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching OBV for symbol: ${formattedSymbol} from Twelve Data...`);
      const obvResponseData = await fetchWithRetry(obvUrl);
      obvData = obvResponseData.values || null;
      console.log(`Successfully fetched OBV for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching OBV for symbol ${formattedSymbol}:`, errorMessage);
    }
    await delay(REQUEST_DELAY_MS);

    // Fetch Supertrend
    try {
      const supertrendUrl = `https://api.twelvedata.com/supertrend?symbol=${formattedSymbol}&interval=1day&multiplier=3&period=10&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching Supertrend for symbol: ${formattedSymbol} from Twelve Data...`);
      const supertrendResponseData = await fetchWithRetry(supertrendUrl);
      supertrendData = supertrendResponseData.values || null;
      console.log(`Successfully fetched Supertrend for symbol: ${formattedSymbol}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching Supertrend for symbol ${formattedSymbol}:`, errorMessage);
    }

    // Combine all indicator data
    const indicatorsData = {
      ema: emaData,
      rsi: rsiData,
      macd: macdData,
      bbands: bbandsData,
      atr: atrData,
      obv: obvData,
      supertrend: supertrendData,
    };

    // Cache the result
    indicatorsCache.set(cacheKey, { data: indicatorsData, timestamp: now });
    console.log(`Successfully fetched and cached technical indicators for symbol: ${formattedSymbol}`);

    return NextResponse.json(indicatorsData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching technical indicators for symbol ${symbol}:`, errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch technical indicators: " + errorMessage },
      { status: 500 }
    );
  }
}
