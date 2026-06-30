import { NextResponse } from "next/server";
import { fetchPrice, fetchTicker24h, fetchKlines, normalizeTicker } from "@/backend/binance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "BTC";
  const interval = searchParams.get("interval") || "1h";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 200;

  try {
    const [price, ticker, klines] = await Promise.all([
      fetchPrice(symbol),
      fetchTicker24h(symbol),
      fetchKlines(symbol, interval, limit),
    ]);

    const summary = normalizeTicker(ticker, price);

    return NextResponse.json({
      data: {
        summary,
        klines,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch Binance data" },
      { status: 502 }
    );
  }
}

