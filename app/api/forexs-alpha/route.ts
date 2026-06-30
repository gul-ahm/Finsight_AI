import { NextResponse } from "next/server";
import { fetchForexQuote, fetchForexTimeSeries } from "@/backend/alphaVantage";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pair = searchParams.get("pair") || "EUR/USD";
  const interval = (searchParams.get("interval") as any) || "60min";

  try {
    const [quote, series] = await Promise.all([
      fetchForexQuote(pair),
      fetchForexTimeSeries(pair, interval),
    ]);
    return NextResponse.json({ data: { quote, series } });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch forex data" },
      { status: error?.message?.includes("ALPHA_VANTAGE_API_KEY") ? 400 : 502 }
    );
  }
}

