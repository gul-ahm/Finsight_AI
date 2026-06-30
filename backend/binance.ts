const BINANCE_BASE = "https://api.binance.com";

function pairFromSymbol(symbol: string) {
  const s = symbol.trim().toUpperCase();
  return s.endsWith("USDT") ? s : `${s}USDT`;
}

export async function fetchTicker24h(symbol: string) {
  const pair = pairFromSymbol(symbol);
  const url = `${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${pair}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Failed to fetch Binance 24h ticker");
  return res.json();
}

export async function fetchPrice(symbol: string) {
  const pair = pairFromSymbol(symbol);
  const url = `${BINANCE_BASE}/api/v3/ticker/price?symbol=${pair}`;
  const res = await fetch(url, { next: { revalidate: 15 } });
  if (!res.ok) throw new Error("Failed to fetch Binance price");
  return res.json();
}

export async function fetchKlines(symbol: string, interval = "1h", limit = 200) {
  const pair = pairFromSymbol(symbol);
  const params = new URLSearchParams({ symbol: pair, interval, limit: String(limit) });
  const url = `${BINANCE_BASE}/api/v3/klines?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch Binance klines");
  const raw = await res.json();
  // Normalize to { time, open, high, low, close, volume }
  // Binance kline format: [time, open, high, low, close, volume, closeTime, quoteAssetVolume, trades, takerBuyBase, takerBuyQuote, ignore]
  return raw.map((k: [number, string, string, string, string, string, number, string, number, string, string, string]) => ({
    time: k[0],
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));
}

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  [key: string]: any; // Allow other fields from API
}

export function normalizeTicker(ticker: BinanceTicker, priceObj?: { price: string }) {
  return {
    symbol: ticker.symbol,
    price: priceObj ? Number(priceObj.price) : Number(ticker.lastPrice),
    change24h: Number(ticker.priceChangePercent),
    high24h: Number(ticker.highPrice),
    low24h: Number(ticker.lowPrice),
    volume24h: Number(ticker.volume),
  };
}

