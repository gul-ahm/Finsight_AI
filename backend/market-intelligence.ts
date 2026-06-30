import { ChatGroq } from "@langchain/groq";

/**
 * Minimal Tavily search integration
 * Uses server-side `TAVILY_API_KEY` to query Tavily Search API.
 */

type TavilySearchParams = {
  query: string;
  searchDepth?: "basic" | "advanced";
  maxResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
};

type TavilySearchResult = {
  query: string;
  results: Array<{
    title: string;
    url: string;
    content?: string;
    score?: number;
    publishedDate?: string;
    site?: string;
  }>;
  cost?: number;
};

const DISABLED_MESSAGE = {
  error: "Market intelligence features are temporarily limited.",
  timestamp: new Date().toISOString()
};

export async function getMarketIntelligence(symbol: string, queryType: string = "general") {
  return {
    symbol,
    queryType,
    ...DISABLED_MESSAGE
  };
}

export async function getComprehensiveMarketOverview(symbol: string) {
  return {
    symbol,
    ...DISABLED_MESSAGE
  };
}

export async function getMarketSentiment(symbol: string) {
  return {
    symbol,
    queryType: "sentiment",
    ...DISABLED_MESSAGE
  };
}

export async function getLatestNews(symbol: string) {
  // Basic passthrough to Tavily with symbol context when available
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return { symbol, queryType: "news", ...DISABLED_MESSAGE };
  }

  const query = `${symbol} finance market news latest`;
  const res = await tavilySearch({ query, searchDepth: "basic", maxResults: 5 });
  return { symbol, queryType: "news", ...res };
}

export async function getGeopoliticalAnalysis(symbol: string) {
  return {
    symbol,
    queryType: "geopolitical",
    ...DISABLED_MESSAGE
  };
}

export async function getFundamentalAnalysis(symbol: string) {
  return {
    symbol,
    queryType: "fundamental",
    ...DISABLED_MESSAGE
  };
}

export async function getTechnicalAnalysis(symbol: string) {
  return {
    symbol,
    queryType: "technical",
    ...DISABLED_MESSAGE
  };
}

export async function getMacroeconomicAnalysis(symbol: string) {
  return {
    symbol,
    queryType: "macroeconomic",
    ...DISABLED_MESSAGE
  };
}

export async function getRegulatoryAnalysis(symbol: string) {
  return {
    symbol,
    queryType: "regulatory",
    ...DISABLED_MESSAGE
  };
}

export async function getMarketAlerts(symbol: string) {
  return {
    symbol,
    ...DISABLED_MESSAGE
  };
}

/**
 * Public function to run a Tavily search
 */
export async function searchMarketIntelligence(query: string, options: Omit<TavilySearchParams, "query"> = {}) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return { query, ...DISABLED_MESSAGE };
  }
  return tavilySearch({ query, ...options });
}

/**
 * Internal: Tavily HTTP search
 */
async function tavilySearch(params: TavilySearchParams): Promise<TavilySearchResult> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return { query: params.query, results: [], ...DISABLED_MESSAGE } as TavilySearchResult;
  }

  const body = {
    query: params.query,
    search_depth: params.searchDepth || "basic",
    max_results: Math.min(params.maxResults ?? 5, 20),
    include_domains: params.includeDomains,
    exclude_domains: params.excludeDomains,
  };

  const resp = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    // Return graceful empty result on error
    return { query: params.query, results: [] };
  }

  const data = await resp.json();
  // Normalize known Tavily fields
  const results = Array.isArray(data.results) ? data.results.map((r: {
    title: string;
    url: string;
    content?: string;
    score?: number;
    published_date?: string;
    publishedDate?: string;
    site?: string;
  }) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
    publishedDate: r.published_date || r.publishedDate,
    site: r.site,
  })) : [];

  return {
    query: params.query,
    results,
    cost: typeof data.cost === "number" ? data.cost : undefined,
  };
}
