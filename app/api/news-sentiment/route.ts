import { NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = "force-dynamic";

// In-memory cache for news sentiment data
const sentimentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  const upperSymbol = symbol.toUpperCase();

  // Check cache
  const cacheKey = `news_sentiment_${upperSymbol}`;
  const cachedData = sentimentCache.get(cacheKey);
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Returning cached news sentiment for symbol: ${upperSymbol}`);
    return NextResponse.json(cachedData.data);
  }

  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      console.error("ALPHA_VANTAGE_API_KEY is not set");
      return NextResponse.json(
        { error: "Alpha Vantage API key is not configured" },
        { status: 500 }
      );
    }

    // Determine the ticker format for Alpha Vantage
    // For crypto pairs like BTC/USD, Alpha Vantage uses CRYPTO:BTC
    // For forex pairs like EURUSD, Alpha Vantage uses FOREX:EUR
    // For stocks, just use the ticker directly
    let avTicker = upperSymbol;
    let assetType = 'stock';

    // Check if it's a crypto pair (contains / or common crypto symbols)
    const cryptoSymbols = ['BTC', 'ETH', 'LTC', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM', 'ALGO', 'FTM', 'NEAR', 'APE', 'SHIB', 'BNB'];
    if (upperSymbol.includes('/')) {
      const base = upperSymbol.split('/')[0];
      if (cryptoSymbols.includes(base)) {
        avTicker = `CRYPTO:${base}`;
        assetType = 'crypto';
      } else {
        avTicker = `FOREX:${base}`;
        assetType = 'forex';
      }
    } else if (cryptoSymbols.some(c => upperSymbol.startsWith(c) && upperSymbol.length > c.length)) {
      // Handle BTCUSD, ETHUSD etc
      const matchedCrypto = cryptoSymbols.find(c => upperSymbol.startsWith(c));
      if (matchedCrypto) {
        avTicker = `CRYPTO:${matchedCrypto}`;
        assetType = 'crypto';
      }
    } else if (upperSymbol.length === 6 && /^[A-Z]{6}$/.test(upperSymbol)) {
      // Forex pair like EURUSD
      const base = upperSymbol.slice(0, 3);
      avTicker = `FOREX:${base}`;
      assetType = 'forex';
    }

    console.log(`Fetching Alpha Vantage NEWS_SENTIMENT for: ${avTicker} (type: ${assetType})`);

    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${avTicker}&limit=50&apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Check for API error messages
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }
    if (data['Note']) {
      console.warn('Alpha Vantage rate limit note:', data['Note']);
    }
    if (data['Information']) {
      console.warn('Alpha Vantage info:', data['Information']);
      // Rate limit — return empty but valid response
      const rateLimitResult = buildEmptyResult(upperSymbol);
      return NextResponse.json(rateLimitResult);
    }

    const feed = data.feed || [];
    console.log(`Alpha Vantage returned ${feed.length} news articles for ${avTicker}`);

    // Transform Alpha Vantage articles into our post format
    const posts = feed.map((article: any, index: number) => {
      // Find ticker-specific sentiment if available
      const tickerSentiment = article.ticker_sentiment?.find((ts: any) =>
        ts.ticker === avTicker || ts.ticker === upperSymbol || ts.ticker === upperSymbol.split('/')[0]
      );

      const sentimentScore = tickerSentiment
        ? parseFloat(tickerSentiment.ticker_sentiment_score)
        : article.overall_sentiment_score || 0;

      const sentimentLabel = classifySentiment(sentimentScore);
      const relevanceScore = tickerSentiment
        ? parseFloat(tickerSentiment.relevance_score)
        : 0.5;

      // Parse the published time (format: YYYYMMDDTHHMMSS)
      const timeStr = article.time_published || '';
      let createdUtc = Math.floor(Date.now() / 1000);
      if (timeStr.length >= 15) {
        const year = timeStr.slice(0, 4);
        const month = timeStr.slice(4, 6);
        const day = timeStr.slice(6, 8);
        const hour = timeStr.slice(9, 11);
        const min = timeStr.slice(11, 13);
        const sec = timeStr.slice(13, 15);
        const d = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
        if (!isNaN(d.getTime())) {
          createdUtc = Math.floor(d.getTime() / 1000);
        }
      }

      // Extract positive/negative sentiment words from topics
      const positiveWords: string[] = [];
      const negativeWords: string[] = [];
      if (sentimentScore > 0.15) {
        positiveWords.push(sentimentLabel.toLowerCase());
        if (article.topics) {
          article.topics.slice(0, 2).forEach((t: any) => positiveWords.push(t.topic));
        }
      } else if (sentimentScore < -0.15) {
        negativeWords.push(sentimentLabel.toLowerCase());
        if (article.topics) {
          article.topics.slice(0, 2).forEach((t: any) => negativeWords.push(t.topic));
        }
      }

      return {
        id: `av_${index}_${createdUtc}`,
        title: article.title || 'Untitled',
        selftext: article.summary || '',
        author: article.source || 'Unknown',
        created_utc: createdUtc,
        score: Math.round(relevanceScore * 100),
        num_comments: 0,
        permalink: article.url || '#',
        url: article.url || '#',
        subreddit: article.source || 'News',
        ups: Math.round(relevanceScore * 100),
        downs: 0,
        upvote_ratio: relevanceScore,
        sentiment: {
          label: sentimentLabel,
          score: Math.round(sentimentScore * 10 * 100) / 100,
          confidence: relevanceScore >= 0.5 ? 'High' as const : relevanceScore >= 0.3 ? 'Medium' as const : 'Low' as const,
          words: {
            positive: positiveWords,
            negative: negativeWords,
          },
        },
        relevance_score: Math.round(relevanceScore * 100) / 100,
      };
    });

    // Calculate overall statistics
    const totalPosts = posts.length;
    const bullishCount = posts.filter((p: any) => p.sentiment.label === 'Bullish' || p.sentiment.label === 'Somewhat-Bullish').length;
    const bearishCount = posts.filter((p: any) => p.sentiment.label === 'Bearish' || p.sentiment.label === 'Somewhat-Bearish').length;
    const neutralCount = posts.filter((p: any) => p.sentiment.label === 'Neutral').length;

    const averageScore = totalPosts > 0
      ? posts.reduce((sum: number, p: any) => sum + p.sentiment.score, 0) / totalPosts
      : 0;

    const overallSentiment = averageScore > 1 ? 'Bullish' : averageScore < -1 ? 'Bearish' : 'Neutral';

    const result = {
      symbol: upperSymbol,
      posts,
      total_posts: totalPosts,
      bullish_count: bullishCount,
      bearish_count: bearishCount,
      neutral_count: neutralCount,
      bullish_percentage: totalPosts > 0 ? Math.round((bullishCount / totalPosts) * 100) : 0,
      bearish_percentage: totalPosts > 0 ? Math.round((bearishCount / totalPosts) * 100) : 0,
      neutral_percentage: totalPosts > 0 ? Math.round((neutralCount / totalPosts) * 100) : 0,
      average_sentiment_score: Math.round(averageScore * 100) / 100,
      overall_sentiment: overallSentiment,
      confidence: totalPosts >= 10 ? 'High' : totalPosts >= 5 ? 'Medium' : totalPosts > 0 ? 'Low' : 'None',
      source: 'Alpha Vantage News Sentiment',
    };

    // Cache the result
    sentimentCache.set(cacheKey, { data: result, timestamp: now });
    console.log(`Successfully cached news sentiment for ${upperSymbol}: ${totalPosts} articles, overall: ${overallSentiment}`);

    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching news sentiment for ${symbol}:`, errorMessage);

    // Return empty but valid response on error
    const fallbackResult = buildEmptyResult(upperSymbol);
    sentimentCache.set(cacheKey, { data: fallbackResult, timestamp: now });
    return NextResponse.json(fallbackResult);
  }
}

// Classify sentiment score into label
function classifySentiment(score: number): "Bullish" | "Somewhat-Bullish" | "Neutral" | "Somewhat-Bearish" | "Bearish" {
  if (score >= 0.35) return "Bullish";
  if (score >= 0.15) return "Somewhat-Bullish";
  if (score > -0.15) return "Neutral";
  if (score > -0.35) return "Somewhat-Bearish";
  return "Bearish";
}

// Build an empty but valid response
function buildEmptyResult(symbol: string) {
  return {
    symbol,
    posts: [],
    total_posts: 0,
    bullish_count: 0,
    bearish_count: 0,
    neutral_count: 0,
    bullish_percentage: 0,
    bearish_percentage: 0,
    neutral_percentage: 0,
    average_sentiment_score: 0,
    overall_sentiment: 'Neutral',
    confidence: 'None',
    source: 'Alpha Vantage News Sentiment',
  };
}
