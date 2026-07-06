import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

// In-memory cache for crypto data (symbol -> data)
const cryptoCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Utility function to fetch with retry on rate limit
const fetchWithRetry = async (
  url: string,
  maxRetries: number = 3,
  baseDelay: number = 2000 // 2 seconds delay for fast serverless function execution
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        const delay = baseDelay * attempt;
        console.log(
          `Rate limit exceeded for URL ${url}. Retrying in ${delay / 1000} seconds... (Attempt ${attempt}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      
      const contentType = response.headers.get("content-type") || "";
      if (!response.ok) {
        let errMsg = `HTTP Error ${response.status}: ${response.statusText}`;
        if (contentType.includes("application/json")) {
          const errJson = await response.json().catch(() => null);
          if (errJson && errJson.message) {
            errMsg = errJson.message;
          }
        } else {
          const errText = await response.text().catch(() => "");
          if (errText) {
            errMsg = errText.substring(0, 150);
          }
        }
        throw new Error(errMsg);
      }
      
      if (!contentType.includes("application/json")) {
        const text = await response.text().catch(() => "");
        throw new Error(`Expected JSON but received Content-Type: ${contentType}. Content: ${text.substring(0, 150)}`);
      }
      
      const data = await response.json();
      
      // Twelve Data returns 200 OK with status: "error" for errors
      if (data && data.status === "error") {
        if (data.code === 429) {
          const delay = baseDelay * attempt;
          console.log(
            `Twelve Data internal rate limit for URL ${url}. Retrying in ${delay / 1000} seconds... (Attempt ${attempt}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(data.message || "Twelve Data internal API error");
      }
      
      return data;
    } catch (err: any) {
      if (attempt === maxRetries) {
        throw err;
      }
      console.warn(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Max retries reached");
};

export async function GET(request: Request) {
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
  const cachedData = cryptoCache.get(cacheKey);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Returning cached crypto data for symbol: ${formattedSymbol}`);
    return NextResponse.json(cachedData.data);
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY || process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
      console.error("TWELVE_DATA_API_KEY / NEXT_PUBLIC_TWELVEDATA_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    let finalSymbol = formattedSymbol;
    let quoteData: any;
    let priceData: any;
    let eodData: any;
    let timeSeriesData: any;

    const doFetch = async (sym: string) => {
      // Fetch Quote Data
      const quoteUrl = `https://api.twelvedata.com/quote?symbol=${sym}&apikey=${apiKey}`;
      console.log(`Fetching quote data for symbol: ${sym} from Twelve Data...`);
      const q = await fetchWithRetry(quoteUrl);

      // Fetch Price Data
      const priceUrl = `https://api.twelvedata.com/price?symbol=${sym}&apikey=${apiKey}`;
      console.log(`Fetching price data for symbol: ${sym} from Twelve Data...`);
      const p = await fetchWithRetry(priceUrl);

      // Fetch EOD Data
      const eodUrl = `https://api.twelvedata.com/eod?symbol=${sym}&apikey=${apiKey}`;
      console.log(`Fetching EOD data for symbol: ${sym} from Twelve Data...`);
      const e = await fetchWithRetry(eodUrl);

      // Fetch Time Series Data
      const timeSeriesUrl = `https://api.twelvedata.com/time_series?symbol=${sym}&interval=1day&outputsize=10&apikey=${apiKey}`;
      console.log(`Fetching time series data for symbol: ${sym} from Twelve Data...`);
      const t = await fetchWithRetry(timeSeriesUrl);

      return { q, p, e, t };
    };

    try {
      const results = await doFetch(finalSymbol);
      quoteData = results.q;
      priceData = results.p;
      eodData = results.e;
      timeSeriesData = results.t;
    } catch (firstError: any) {
      if (
        firstError.message && 
        (firstError.message.includes("symbol or figi") || firstError.message.includes("missing or invalid")) &&
        finalSymbol.endsWith("/USDT")
      ) {
        console.log(`Failed to fetch ${finalSymbol}. Retrying with USD fallback...`);
        finalSymbol = finalSymbol.replace("/USDT", "/USD");
        const results = await doFetch(finalSymbol);
        quoteData = results.q;
        priceData = results.p;
        eodData = results.e;
        timeSeriesData = results.t;
      } else {
        throw firstError;
      }
    }

    // Construct the response
    const response = {
      timeSeries: {
        meta: {
          symbol: timeSeriesData.meta?.symbol || finalSymbol,
          interval: timeSeriesData.meta?.interval || "1day",
          currency_base: finalSymbol.split("/")[0],
          currency_quote: finalSymbol.split("/")[1],
          type: "crypto",
        },
        values: timeSeriesData.values || [],
        status: timeSeriesData.status || "ok",
      },
      quote: {
        symbol: quoteData.symbol || finalSymbol,
        name: quoteData.name || "Unknown",
        currency_base: finalSymbol.split("/")[0],
        currency_quote: finalSymbol.split("/")[1],
        datetime: quoteData.datetime || new Date().toISOString().split("T")[0],
        open: quoteData.open || "0",
        high: quoteData.high || "0",
        low: quoteData.low || "0",
        close: quoteData.close || "0",
        previous_close: quoteData.previous_close || "0",
        change: quoteData.change || "0",
        percent_change: quoteData.percent_change || "0",
        volume: quoteData.volume || "0",
      },
      price: {
        price: priceData.price || "0",
      },
      eod: {
        symbol: eodData.symbol || finalSymbol,
        currency_base: finalSymbol.split("/")[0],
        currency_quote: finalSymbol.split("/")[1],
        datetime: eodData.datetime || new Date().toISOString().split("T")[0],
        close: eodData.close || "0",
      },
    };

    // Cache the result
    cryptoCache.set(cacheKey, { data: response, timestamp: now });
    console.log(`Successfully fetched and cached crypto data for symbol: ${formattedSymbol}`);

    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching crypto data for symbol ${symbol}:`, errorMessage);
    return NextResponse.json(
      { error: `Failed to fetch crypto data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
