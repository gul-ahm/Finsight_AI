import { NextResponse } from 'next/server';
import { EMA, RSI, MACD, BollingerBands, ATR, OBV } from 'technicalindicators';

// Force dynamic rendering
export const dynamic = "force-dynamic";

// In-memory cache for technical indicators data (symbol -> indicators data)
const indicatorsCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Utility function to fetch with retry on rate limit
async function fetchWithRetry(url: string, maxRetries: number = 1, baseDelay: number = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded");
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
      if (data.code === 429 || data.status === "error") {
         throw new Error(`API error: ${data.message || "Rate limit"}`);
      }
      return data;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, baseDelay));
    }
}

function calculateSupertrend(highs: number[], lows: number[], closes: number[], dates: string[], period: number = 10, multiplier: number = 3) {
  const atrValues = ATR.calculate({ high: highs, low: lows, close: closes, period });
  
  const supertrend = [];
  const startIdx = highs.length - atrValues.length;
  
  let prevUpperBand = 0;
  let prevLowerBand = 0;
  let prevDirection = 1; // 1 for up, -1 for down

  // Initialize the first element
  if (atrValues.length > 0) {
    const i = startIdx;
    const hl2 = (highs[i] + lows[i]) / 2;
    prevUpperBand = hl2 + multiplier * atrValues[0];
    prevLowerBand = hl2 - multiplier * atrValues[0];
  }

  for (let j = 0; j < atrValues.length; j++) {
    const i = startIdx + j;
    const hl2 = (highs[i] + lows[i]) / 2;
    const atr = atrValues[j];
    
    const basicUpperBand = hl2 + multiplier * atr;
    const basicLowerBand = hl2 - multiplier * atr;

    let finalUpperBand = basicUpperBand;
    let finalLowerBand = basicLowerBand;

    if (j > 0) {
      const prevClose = closes[i - 1];
      finalUpperBand = (basicUpperBand < prevUpperBand || prevClose > prevUpperBand) ? basicUpperBand : prevUpperBand;
      finalLowerBand = (basicLowerBand > prevLowerBand || prevClose < prevLowerBand) ? basicLowerBand : prevLowerBand;
    }

    let currentDirection = prevDirection;
    let currentSupertrend = 0;

    if (closes[i] > finalUpperBand) {
      currentDirection = 1;
    } else if (closes[i] < finalLowerBand) {
      currentDirection = -1;
    }

    if (currentDirection === 1) {
      currentSupertrend = finalLowerBand;
    } else {
      currentSupertrend = finalUpperBand;
    }

    supertrend.push({
      datetime: dates[i],
      supertrend: String(currentSupertrend),
      direction: String(currentDirection)
    });

    prevUpperBand = finalUpperBand;
    prevLowerBand = finalLowerBand;
    prevDirection = currentDirection;
  }

  return supertrend.reverse(); // Newest to oldest to match Twelve Data format
}

export async function GET(request: Request) {
  const TWELVE_DATA_API_KEY = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY || process.env.TWELVE_DATA_API_KEY;
  if (!TWELVE_DATA_API_KEY) {
    console.error("TWELVE_DATA_API_KEY / NEXT_PUBLIC_TWELVEDATA_API_KEY is not set in environment variables");
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
    let tsResponse = null;
    let finalSymbol = formattedSymbol;

    const fetchIndicatorsData = async (sym: string) => {
      const tsUrl = `https://api.twelvedata.com/time_series?symbol=${sym}&interval=1day&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching historical data for local indicators calculation: ${sym}`);
      const tsResp = await fetchWithRetry(tsUrl);
      
      if (!tsResp || !tsResp.values || tsResp.values.length === 0) {
          throw new Error("Invalid or empty time series data returned from API");
      }
      return tsResp;
    };

    try {
      tsResponse = await fetchIndicatorsData(finalSymbol);
    } catch (firstError: any) {
      if (
        firstError.message && 
        (firstError.message.includes("symbol or figi") || firstError.message.includes("missing or invalid")) &&
        finalSymbol.endsWith("/USDT")
      ) {
        console.log(`Failed to fetch indicators for ${finalSymbol}. Retrying with USD fallback...`);
        finalSymbol = finalSymbol.replace("/USDT", "/USD");
        tsResponse = await fetchIndicatorsData(finalSymbol);
      } else {
        throw firstError;
      }
    }
    
    // 2. Prepare data for technicalindicators (needs chronological order: oldest to newest)
    const rawData = [...tsResponse.values].reverse();
    
    const dates = rawData.map(v => v.datetime);
    const highs = rawData.map(v => parseFloat(v.high));
    const lows = rawData.map(v => parseFloat(v.low));
    const closes = rawData.map(v => parseFloat(v.close));
    const volumes = rawData.map(v => parseFloat(v.volume));

    // 3. Calculate Indicators Locally
    const ema20Raw = EMA.calculate({ period: 20, values: closes });
    const ema50Raw = EMA.calculate({ period: 50, values: closes });
    const rsiRaw = RSI.calculate({ period: 14, values: closes });
    const macdRaw = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    const bbandsRaw = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
    const atrRaw = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const obvRaw = OBV.calculate({ close: closes, volume: volumes });

    // 4. Calculate Supertrend locally
    const supertrendData = calculateSupertrend(highs, lows, closes, dates, 10, 3);

    // 5. Format local calculations to match TwelveData structure
    const formatOutput = (rawArr: any[], keyName: string | null = null, transform: (val: any) => any = v => String(v)) => {
        const result = [];
        let dateIndex = dates.length - 1;
        for (let i = rawArr.length - 1; i >= 0; i--) {
            const dateStr = dates[dateIndex];
            if (keyName) {
                result.push({ datetime: dateStr, [keyName]: transform(rawArr[i]) });
            } else {
                result.push({ datetime: dateStr, ...transform(rawArr[i]) });
            }
            dateIndex--;
        }
        return result;
    };

    const indicatorsData = {
      ema: {
          ema20: formatOutput(ema20Raw, "ema"),
          ema50: formatOutput(ema50Raw, "ema")
      },
      rsi: formatOutput(rsiRaw, "rsi"),
      macd: formatOutput(macdRaw, null, (v) => ({
          macd: String(v.MACD),
          macd_signal: String(v.signal),
          macd_hist: String(v.histogram)
      })),
      bbands: formatOutput(bbandsRaw, null, (v) => ({
          upper_band: String(v.upper),
          middle_band: String(v.middle),
          lower_band: String(v.lower)
      })),
      atr: formatOutput(atrRaw, "atr"),
      obv: formatOutput(obvRaw, "obv"),
      supertrend: supertrendData
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
