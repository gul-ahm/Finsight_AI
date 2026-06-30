import { NextResponse } from "next/server";
import { fetchStockQuote, fetchStockTimeSeries } from "@/backend/alphaVantage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "AAPL";
  const interval = (searchParams.get("interval") as any) || "60min";

  try {
    const [quote, series] = await Promise.all([
      fetchStockQuote(symbol),
      fetchStockTimeSeries(symbol, interval),
    ]);
    return NextResponse.json({ data: { quote, series } });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch stock data" },
      { status: error?.message?.includes("ALPHA_VANTAGE_API_KEY") ? 400 : 502 }
    );
  }
}

