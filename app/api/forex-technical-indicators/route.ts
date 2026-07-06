import { NextResponse } from 'next/server';
import { EMA, RSI, MACD, BollingerBands, ADX, ATR, IchimokuCloud, Stochastic, CCI, ROC } from 'technicalindicators';

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

  // Format symbol (e.g., EURUSD -> EUR/USD)
  let formattedSymbol = symbol.toUpperCase();
  if (!formattedSymbol.includes("/") && formattedSymbol.length === 6) {
    formattedSymbol = `${formattedSymbol.slice(0, 3)}/${formattedSymbol.slice(3)}`;
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
    // 1. Fetch historical data (100 days)
    const tsUrl = `https://api.twelvedata.com/time_series?symbol=${formattedSymbol}&interval=1day&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
    console.log(`Fetching historical data for local indicators calculation: ${formattedSymbol}`);
    const tsResponse = await fetchWithRetry(tsUrl);
    
    if (!tsResponse || !tsResponse.values || tsResponse.values.length === 0) {
        throw new Error("Invalid or empty time series data returned from API");
    }

    // 2. Prepare data for technicalindicators (needs chronological order: oldest to newest)
    const rawData = [...tsResponse.values].reverse();
    
    const dates = rawData.map(v => v.datetime);
    const highs = rawData.map(v => parseFloat(v.high));
    const lows = rawData.map(v => parseFloat(v.low));
    const closes = rawData.map(v => parseFloat(v.close));
    const volumes = rawData.map(v => parseFloat(v.volume) || 0); // Forex might not have volume

    // 3. Calculate Indicators Locally
    const ema20Raw = EMA.calculate({ period: 20, values: closes });
    const ema50Raw = EMA.calculate({ period: 50, values: closes });
    const rsiRaw = RSI.calculate({ period: 14, values: closes });
    const macdRaw = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
    const bbandsRaw = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
    const adxRaw = ADX.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const atrRaw = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const ichimokuRaw = IchimokuCloud.calculate({ high: highs, low: lows, conversionPeriod: 9, basePeriod: 26, spanPeriod: 52, displacement: 26 });
    const stochRaw = Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 });
    const cciRaw = CCI.calculate({ high: highs, low: lows, close: closes, period: 14 });
    const momRaw = ROC.calculate({ values: closes, period: 10 }); // Momentum proxy

    // 4. Fetch complex indicator from TwelveData (Pivot Points)
    let pivotPointsData = null;
    try {
      const pivotUrl = `https://api.twelvedata.com/pivot_points_hl?symbol=${formattedSymbol}&interval=1day&time_period=20&outputsize=100&apikey=${TWELVE_DATA_API_KEY}`;
      console.log(`Fetching Pivot Points for symbol: ${formattedSymbol} from Twelve Data...`);
      const pivotResponse = await fetchWithRetry(pivotUrl);
      pivotPointsData = pivotResponse.values || null;
    } catch (error) {
      console.error(`Error fetching Pivot Points: ${error}`);
    }

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
      adx: formatOutput(adxRaw, null, (v) => ({
          adx: String(v.adx)
      })),
      atr: formatOutput(atrRaw, "atr"),
      ichimoku: formatOutput(ichimokuRaw, null, (v) => ({
          tenkan_sen: String(v.conversion),
          kijun_sen: String(v.base),
          senkou_span_a: String(v.spanA),
          senkou_span_b: String(v.spanB)
      })),
      stoch: formatOutput(stochRaw, null, (v) => ({
          slow_k: String(v.k),
          slow_d: String(v.d)
      })),
      cci: formatOutput(cciRaw, "cci"),
      mom: formatOutput(momRaw, "mom"),
      pivot_points_hl: pivotPointsData
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
