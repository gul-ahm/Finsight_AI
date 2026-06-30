import { NextResponse } from "next/server";
import { withRateLimit, errorResponse } from '@/backend/api-middleware';
import { RATE_LIMITS } from "@/backend/rate-limiter";

/**
 * GET /api/news
 * Fetch news articles with rate limiting and improved error handling
 * 
 * Query params:
 * - q: search query (default: "finance")
 * - page: page number (default: 1)
 * - pageSize: articles per page (default: 10)
 */
async function handler(request: Request) {
  // Resolve API key from either NEWSAPI_API_KEY (preferred) or legacy NEWS_API_KEY
  const apiKey = process.env.NEWSAPI_API_KEY || process.env.NEWS_API_KEY;
  if (!apiKey) {
    return errorResponse("Missing NEWSAPI_API_KEY (preferred) or legacy NEWS_API_KEY in environment.", 500);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "finance";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "10"), 100); // Cap at 100

  // apiKey is resolved above

  // Build the NewsAPI URL
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
    query + " -crypto -cryptocurrency -bitcoin -ethereum"
  )}&language=en&sortBy=publishedAt&pageSize=${pageSize}&page=${page}&apiKey=${apiKey}`;

  try {
    const response = await fetch(newsApiUrl);

    if (!response.ok) {
      console.warn(`NewsAPI failed with status ${response.status}. Returning mock data.`);
      return NextResponse.json(getMockNews());
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching news from NewsAPI:", error);
    // Fallback to mock data on error
    return NextResponse.json(getMockNews());
  }
}

// Mock Data Generator for Fallback
function getMockNews() {
  return {
    status: "ok",
    totalResults: 10,
    articles: [
      {
        source: { id: "bloomberg", name: "Bloomberg" },
        author: "Sarah Ponczek",
        title: "Global Markets Rally as Inflation Data Shows Cooling Trends",
        description: "Stocks across Europe and Asia gained on Monday as new data suggested inflationary pressures are finally easing, prompting hope for rate cuts.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1611974765270-ca12586343bb?q=80&w=1000&auto=format&fit=crop",
        publishedAt: new Date().toISOString(),
        content: "Global markets showed robust gains..."
      },
      {
        source: { id: "reuters", name: "Reuters" },
        author: "Tech Desk",
        title: "AI Chip Demand Skyrockets, NVDA hits All-Time High",
        description: "NVIDIA Corporation surged another 5% today as demand for AI-specific chips continues to outpace supply in the enterprise sector.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop",
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        content: "The AI revolution shows no signs of slowing..."
      },
      {
        source: { id: "wsj", name: "The Wall Street Journal" },
        author: "Finance Team",
        title: "Crypto Markets Stabilize After Volatile Week",
        description: "Bitcoin and Ethereum held steady support levels this week after a tumultuous period marked by regulatory news and macroeconomic shifts.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=1000&auto=format&fit=crop",
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        content: "Cryptocurrency investors breathed a sigh of relief..."
      },
      {
        source: { id: "cnbc", name: "CNBC" },
        author: "Market Watch",
        title: "Federal Reserve Signals Potential Rate Cut in Q4",
        description: "Meeting minutes released today indicate a growing consensus among Fed officials that the current tightening cycle may be nearing its end.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=1000&auto=format&fit=crop",
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        content: "The Federal Reserve indicated..."
      },
      {
        source: { id: "techcrunch", name: "TechCrunch" },
        author: "Startups",
        title: "FinTech Startup 'PayFast' Raises $50M Series B",
        description: "The payment processing unicorn has secured fresh funding to expand its operations into Southeast Asia and Latin America.",
        url: "#",
        urlToImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1000&auto=format&fit=crop",
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        content: "Venture capital funding is returning..."
      }
    ]
  };
}

// Apply rate limiting: 30 requests per minute for news endpoint
export const GET = withRateLimit(handler, RATE_LIMITS.NEWS);
