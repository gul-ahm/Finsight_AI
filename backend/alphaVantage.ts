const BASE = "https://www.alphavantage.co/query";

function getApiKey() {
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) throw new Error("ALPHA_VANTAGE_API_KEY is not set");
  return key;
}

export async function fetchStockQuote(symbol: string) {
  const apikey = getApiKey();
  const url = `${BASE}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${apikey}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Failed to fetch Alpha Vantage stock quote");
  const json = await res.json();
  const q = json["Global Quote"] || {};
  return {
    symbol: q["01. symbol"] || symbol,
    price: Number(q["05. price"]) || NaN,
    change: Number(q["09. change"]) || NaN,
    changePercent: Number((q["10. change percent"] || "0").replace("%", "")) || NaN,
    high: Number(q["03. high"]) || NaN,
    low: Number(q["04. low"]) || NaN,
    volume: Number(q["06. volume"]) || NaN,
    latestTradingDay: q["07. latest trading day"] || null,
  };
}

export async function fetchStockTimeSeries(symbol: string, interval: "1min"|"5min"|"15min"|"30min"|"60min" = "60min") {
  const apikey = getApiKey();
  const url = `${BASE}?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=compact&apikey=${apikey}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch Alpha Vantage time series");
  const json = await res.json();
  const key = `Time Series (${interval})`;
  const series = json[key] || {};
  return Object.entries(series).map(([time, v]: [string, any]) => ({
    time,
    open: Number(v["1. open"]) || NaN,
    high: Number(v["2. high"]) || NaN,
    low: Number(v["3. low"]) || NaN,
    close: Number(v["4. close"]) || NaN,
    volume: Number(v["5. volume"]) || NaN,
  })).reverse();
}

export async function fetchForexQuote(pair: string) {
  const apikey = getApiKey();
  // pair format: EUR/USD -> from=EUR to=USD
  const [from, to] = pair.includes("/") ? pair.split("/") : [pair.slice(0,3), pair.slice(3,6)];
  const url = `${BASE}?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apikey}`;
  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error("Failed to fetch Alpha Vantage forex quote");
  const json = await res.json();
  const r = json["Realtime Currency Exchange Rate"] || {};
  return {
    from,
    to,
    rate: Number(r["5. Exchange Rate"]) || NaN,
    lastRefreshed: r["6. Last Refreshed"] || null,
  };
}

export async function fetchForexTimeSeries(pair: string, interval: "5min"|"15min"|"30min"|"60min" = "60min") {
  const apikey = getApiKey();
  const [from, to] = pair.includes("/") ? pair.split("/") : [pair.slice(0,3), pair.slice(3,6)];
  const url = `${BASE}?function=FX_INTRADAY&from_symbol=${from}&to_symbol=${to}&interval=${interval}&outputsize=compact&apikey=${apikey}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error("Failed to fetch Alpha Vantage forex series");
  const json = await res.json();
  const key = `Time Series FX (${interval})`;
  const series = json[key] || {};
  return Object.entries(series).map(([time, v]: [string, any]) => ({
    time,
    open: Number(v["1. open"]) || NaN,
    high: Number(v["2. high"]) || NaN,
    low: Number(v["3. low"]) || NaN,
    close: Number(v["4. close"]) || NaN,
  })).reverse();
}

