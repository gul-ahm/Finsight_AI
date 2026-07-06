// app/api/_finnhub.ts

import { fetchWithRetry } from "./_fetchWithRetry";

/**
 * Wrapper to fetch Forex data from Finnhub.
 * Returns data in the same shape as the previous TwelveData implementation.
 */
export async function fetchFinnhubForex(symbol: string) {
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!apiKey) {
    throw new Error("FINNHUB_API_KEY is missing");
  }

  // Convert e.g., "EUR/USD" → "OANDA:EUR_USD"
  const finnhubSymbol = `OANDA:${symbol.replace("/", "_")}`;

  const now = Math.floor(Date.now() / 1000);
  const from = now - 30 * 24 * 60 * 60; // last 30 days of daily candles

  // Use sandbox base URL for testing
  const baseUrl = 'https://finnhub.io/api/v1';
  const candleUrl = `${baseUrl}/forex/candle?symbol=${finnhubSymbol}&resolution=D&from=${from}&to=${now}&token=${apiKey}`;
  const quoteUrl = `${baseUrl}/quote?symbol=${finnhubSymbol}&token=${apiKey}`;

  const candleResp = await fetchWithRetry(candleUrl);
  const candleData = await candleResp.json();

  // 3️⃣ Current price – use the same quote response, field `c` is the latest price
  const quoteResp = await fetchWithRetry(quoteUrl);
  const quoteData = await quoteResp.json();
  const price = quoteData.c;

  // 4️⃣ EOD – approximate using the most recent completed daily candle
  const eod = {
    datetime: candleData.t?.length
      ? new Date(candleData.t[candleData.t.length - 1] * 1000).toISOString()
      : null,
    close: candleData.c?.length ? candleData.c[candleData.c.length - 1] : null,
  };

  // Build the expected structure
  const timeSeries = {
    meta: { symbol, interval: "1day", type: "forex" },
    values: candleData.t?.map((ts: number, i: number) => ({
      datetime: new Date(ts * 1000).toISOString(),
      open: candleData.o?.[i],
      high: candleData.h?.[i],
      low: candleData.l?.[i],
      close: candleData.c?.[i],
    })) ?? [],
    status: "ok",
  };

  const quote = {
    symbol,
    open: quoteData.o,
    high: quoteData.h,
    low: quoteData.l,
    close: quoteData.c,
    previousClose: quoteData.pc,
    timestamp: quoteData.t,
  };

  return {
    timeSeries,
    quote,
    price: { price: price?.toString() ?? null },
    eod: {
      symbol,
      datetime: eod.datetime,
      close: eod.close?.toString() ?? null,
    },
  };
}
