import { fetchWithRetry } from "./_fetchWithRetry";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function fetchTwelveDataForex(symbol: string) {
  const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("TWELVEDATA_API_KEY is missing");
  }

  const baseUrl = "https://api.twelvedata.com";
  
  // Set retries to 0 so we fail fast and fallback instantly on rate limits
  const fetchOpts = { retries: 0, backoffMs: 0 };
  
  // 1️⃣ Historical candles (daily)
  const historyUrl = `${baseUrl}/time_series?symbol=${symbol}&interval=1day&apikey=${apiKey}`;
  const historyResp = await fetchWithRetry(historyUrl, undefined, fetchOpts.retries, fetchOpts.backoffMs);
  const historyJson = await historyResp.json();
  
  if (historyJson.status === "error") {
    if (historyJson.code === 429) throw new RateLimitError(historyJson.message);
    throw new Error(historyJson.message || "Failed to fetch history from TwelveData");
  }

  // 2️⃣ Quote
  const quoteUrl = `${baseUrl}/quote?symbol=${symbol}&apikey=${apiKey}`;
  const quoteResp = await fetchWithRetry(quoteUrl, undefined, fetchOpts.retries, fetchOpts.backoffMs);
  const quoteJson = await quoteResp.json();
  if (quoteJson.status === "error") {
    if (quoteJson.code === 429) throw new RateLimitError(quoteJson.message);
    throw new Error(quoteJson.message);
  }

  // 3️⃣ Price
  const priceUrl = `${baseUrl}/price?symbol=${symbol}&apikey=${apiKey}`;
  const priceResp = await fetchWithRetry(priceUrl, undefined, fetchOpts.retries, fetchOpts.backoffMs);
  const priceJson = await priceResp.json();
  if (priceJson.status === "error") {
    if (priceJson.code === 429) throw new RateLimitError(priceJson.message);
    throw new Error(priceJson.message);
  }

  // 4️⃣ EOD
  const eodUrl = `${baseUrl}/eod?symbol=${symbol}&apikey=${apiKey}`;
  const eodResp = await fetchWithRetry(eodUrl, undefined, fetchOpts.retries, fetchOpts.backoffMs);
  const eodJson = await eodResp.json();
  if (eodJson.status === "error") {
    if (eodJson.code === 429) throw new RateLimitError(eodJson.message);
    throw new Error(eodJson.message);
  }

  return {
    timeSeries: historyJson,
    quote: quoteJson,
    price: priceJson,
    eod: eodJson,
  };
}
