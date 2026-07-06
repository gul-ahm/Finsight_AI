import { NextResponse } from 'next/server';
import { EMA, RSI, MACD, BollingerBands, ADX, ATR } from 'technicalindicators';

// Manual Aroon calculation since technicalindicators doesn't support it
function calculateAroon(highs: number[], lows: number[], period: number = 14) {
    const result = [];
    for (let i = period; i < highs.length; i++) {
        const highSlice = highs.slice(i - period, i + 1);
        const lowSlice = lows.slice(i - period, i + 1);
        
        let highestIndex = 0;
        let highestVal = highSlice[0];
        let lowestIndex = 0;
        let lowestVal = lowSlice[0];
        
        for (let j = 1; j <= period; j++) {
            if (highSlice[j] >= highestVal) { highestVal = highSlice[j]; highestIndex = j; }
            if (lowSlice[j] <= lowestVal) { lowestVal = lowSlice[j]; lowestIndex = j; }
        }
        
        // Days since high/low is (period - index)
        const daysSinceHigh = period - highestIndex;
        const daysSinceLow = period - lowestIndex;
        
        const up = ((period - daysSinceHigh) / period) * 100;
        const down = ((period - daysSinceLow) / period) * 100;
        
        result.push({ up, down });
    }
    return result;
}

// Force dynamic rendering
export const dynamic = "force-dynamic";

// In-memory cache for technical indicators data (symbol -> indicators data)
const indicatorsCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Utility function to fetch with retry on rate limit
async function fetchWithRetry(url: string, maxRetries: number = 1) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded");
        }
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.message || "Unknown error"}`);
      }
      const data = await response.json();
      if (data.code === 429 || data.status === "error") {
         throw new Error(`API error: ${data.message || "Rate limit"}`);
      }
      return data;
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
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

  // Check cache
  const cacheKey = symbol.toUpperCase();
  const cachedData = indicatorsCache.get(cacheKey);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Returning cached technical indicators for symbol: ${symbol}`);
    return NextResponse.json(cachedData.data);
  }

  try {
    // 1. Fetch historical data (100 days)
    const tsUrl = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
    console.log(`Fetching historical data for local indicators calculation: ${symbol}`);
    const tsResponse = await fetchWithRetry(tsUrl);
    
    if (!tsResponse || !tsResponse.values || tsResponse.values.length === 0) {
        throw new Error("Invalid or empty time series data returned from API");
    }

    // 2. Prepare data for technicalindicators (needs chronological order: oldest to newest)
    // TwelveData returns descending (newest first), so we must reverse.
    const rawData = [...tsResponse.values].reverse();
    
    const dates = rawData.map(v => v.datetime);
    const opens = rawData.map(v => parseFloat(v.open));
    const highs = rawData.map(v => parseFloat(v.high));
    const lows = rawData.map(v => parseFloat(v.low));
    const closes = rawData.map(v => parseFloat(v.close));
    const volumes = rawData.map(v => parseFloat(v.volume));

    // 3. Calculate Indicators
    const ema20Raw = EMA.calculate({ period: 20, values: closes });
    const ema50Raw = EMA.calculate({ period: 50, values: closes });
    const rsiRaw = RSI.calculate({ period: 14, values: closes });
    const macdRaw = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    const bbandsRaw = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
    const adxRaw = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const atrRaw = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const aroonRaw = calculateAroon(highs, lows, 14);

    // 4. Format functions to match TwelveData structure
    // Since mathematical indicators drop the first N elements (lookback period), 
    // we map them backwards against the date array so dates align perfectly.
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
        return result; // TwelveData returns descending, so we keep this order
    };

    // 5. Construct final JSON response
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
      adx: formatOutput(adxRaw, null, (v) => ({
          adx: String(v.adx)
      })),
      atr: formatOutput(atrRaw, "atr"),
      aroon: formatOutput(aroonRaw, null, (v) => ({
          aroon_up: String(v.up),
          aroon_down: String(v.down)
      }))
    };

    // Cache the result
    indicatorsCache.set(cacheKey, { data: indicatorsData, timestamp: now });
    console.log(`Successfully locally calculated and cached technical indicators for symbol: ${symbol}`);

    return NextResponse.json(indicatorsData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error calculating technical indicators for symbol ${symbol}:`, errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch/calculate technical indicators: " + errorMessage },
      { status: 500 }
    );
  }
}
