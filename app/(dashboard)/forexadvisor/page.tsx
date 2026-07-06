"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from '@/frontend/ui/button';
import { Textarea } from '@/frontend/ui/textarea';
import { useToast } from "@/frontend/hooks/use-toast";
import Link from "next/link";
import { MessageCircle, Send, TrendingUp, X, Menu, Loader2, Plus, Clock, Trash2, LineChart, DollarSign } from "lucide-react";
import { generateChatResponse } from "@/app/actions/chat";
import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getMarketIntelligence, getComprehensiveMarketOverview, getLatestNews, getGeopoliticalAnalysis, getMarketSentiment, getFundamentalAnalysis, getTechnicalAnalysis, getMacroeconomicAnalysis, getRegulatoryAnalysis, getMarketAlerts } from "@/backend/market-intelligence";
import { useSession } from "next-auth/react";

// Theme colors inspired by from-green-500 to-emerald-600
const green500 = "#10B981"; // Tailwind from-green-500
const emerald600 = "#059669"; // Tailwind to-emerald-600

// In-memory cache for forex data and indicators
const forexDataCache = new Map<string, { data: any; timestamp: number }>();
const indicatorsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limit: 8 requests per minute (60 seconds / 8 = 7.5 seconds per request)
const REQUEST_DELAY_MS = 7500; // 7.5 seconds delay between requests
const API_CALL_THRESHOLD = 4; // Apply delay only if API calls exceed this threshold

// Utility function to delay execution
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to fetch with retry on rate limit
async function fetchWithRetry(url: string, maxRetries: number = 1, retryDelayMs: number = 0): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          console.warn(`Rate limit hit for URL: ${url}. Retrying (${attempt}/${maxRetries}) after ${retryDelayMs}ms...`);
          if (attempt === maxRetries) {
            throw new Error("Rate limit exceeded after maximum retries");
          }
          await delay(retryDelayMs);
          continue;
        }
        throw new Error(`API error: ${JSON.stringify(errorData)}`);
      }
      return await response.json();
    } catch (error: unknown) {
      if (attempt === maxRetries) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.warn(`Fetch attempt ${attempt} failed for URL: ${url}. Retrying after ${retryDelayMs}ms...`, errorMessage);
      await delay(retryDelayMs);
    }
  }
  throw new Error("Unexpected error in fetchWithRetry");
}

// Fetch forex pairs using the provided API route
async function fetchForexPairs(apiCallCount: { count: number }): Promise<any[]> {
  const cacheKey = "forexPairs";
  const cachedData = forexDataCache.get(cacheKey);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log("Returning cached forex pairs");
    return cachedData.data;
  }

  const url = "/api/forexs?page=1&perPage=1000¤cyGroup=All";
  const response = await fetchWithRetry(url);
  apiCallCount.count += 1;
  if (apiCallCount.count > API_CALL_THRESHOLD) {
    await delay(REQUEST_DELAY_MS);
  }

  const data = response || { pairs: [] };
  const forexPairs = data.pairs ?? [];
  forexDataCache.set(cacheKey, { data: forexPairs, timestamp: now });
  return forexPairs;
}

// Fetch forex data (quote, time series) using Twelve Data API
async function fetchForexData(symbol: string, apiCallCount: { count: number }, fields: string[] = ["quote"]): Promise<any> {
  const cacheKey = `forexData_${symbol.toUpperCase()}`;
  const cachedData = forexDataCache.get(cacheKey);
  const now = Date.now();
  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Returning cached forex data for symbol: ${symbol}`);
    return cachedData.data;
  }

  const apiKey = process.env.NEXT_PUBLIC_TWELVEDATA_API_KEY;
  if (!apiKey) {
    throw new Error("Twelve Data API key is not configured.");
  }

  const data: any = {};
  if (fields.includes("quote")) {
    const quoteUrl = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
    data.quote = await fetchWithRetry(quoteUrl);
    apiCallCount.count += 1;
    if (apiCallCount.count > API_CALL_THRESHOLD) {
      await delay(REQUEST_DELAY_MS);
    }
  }
  if (fields.includes("timeSeries")) {
    const timeSeriesUrl = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=30&apikey=${apiKey}`;
    data.timeSeries = await fetchWithRetry(timeSeriesUrl);
    apiCallCount.count += 1;
    if (apiCallCount.count > API_CALL_THRESHOLD) {
      await delay(REQUEST_DELAY_MS);
    }
  }

  forexDataCache.set(cacheKey, { data, timestamp: now });
  return data;
}

// Fetch specific technical indicators using local backend
async function fetchIndicators(
  symbol: string,
  requestedIndicators: string[],
  apiCallCount: { count: number }
): Promise<any> {
  const cacheKey = `indicators_${symbol.toUpperCase()}`;
  const cachedData = indicatorsCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) return cachedData.data;

  try {
    const response = await fetch(`/api/forex-technical-indicators?symbol=${symbol}`);
    if (!response.ok) return null;
    const data = await response.json();
    indicatorsCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("Error fetching forex indicators:", error);
    return null;
  }
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  forexData?: any;
  indicatorsData?: any;
  redditData?: any;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

const chatHistories = new Map<string, InMemoryChatMessageHistory>();

export default function ForexAdvisor() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>(Date.now().toString());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [forexPairs, setForexPairs] = useState<any[]>([]);
  const [forexPairsError, setForexPairsError] = useState<string | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/auth/signin';
    }
  }, [status]);

  useEffect(() => {
    const loadForexPairs = async () => {
      const apiCallCount = { count: 0 };
      try {
        const pairs = await fetchForexPairs(apiCallCount);
        setForexPairs(pairs);
        setForexPairsError(null);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Error loading forex pairs:", errorMessage);
        setForexPairsError("Failed to load forex pairs. Some features may be limited. Please try refreshing the page.");
        toast({
          title: "Error",
          description: "Failed to load forex pairs. Some features may be limited.",
          variant: "destructive",
        });
      }
    };
    loadForexPairs();
  }, [toast]);

  useEffect(() => {
    const initialMessage: Message = {
      role: "assistant",
      content: `Hey there! I'm your Forex Buddy, here to help you navigate the currency markets. Ask me anything—like "Analyze EUR/USD" or "What's the RSI for GBP/JPY?"—and I'll break it down for you with the latest data. What's on your mind?`,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (!chatHistories.has(currentChatId)) {
      chatHistories.set(currentChatId, new InMemoryChatMessageHistory());
      const newSession: ChatSession = {
        id: currentChatId,
        title: "Welcome Chat",
        messages: [initialMessage],
      };
      setChatSessions((prev) => [...prev, newSession]);
      setMessages([initialMessage]);
    }
  }, [currentChatId]);

  useEffect(() => {
    const currentSession = chatSessions.find((session) => session.id === currentChatId);
    setMessages(currentSession?.messages ?? []);
  }, [currentChatId, chatSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleClearChat = () => {
    setMessages([]);
    chatHistories.set(currentChatId, new InMemoryChatMessageHistory());
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentChatId ? { ...session, messages: [] } : session
      )
    );
    toast({
      title: "Chat Cleared",
      description: "Your chat history has been cleared.",
    });
  };

  const handleNewChat = () => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentChatId ? { ...session, messages } : session
      )
    );
    const newChatId = Date.now().toString();
    chatHistories.set(newChatId, new InMemoryChatMessageHistory());
    const newSession: ChatSession = {
      id: newChatId,
      title: `Chat ${chatSessions.length + 1}`,
      messages: [],
    };
    setChatSessions((prev) => [...prev, newSession]);
    setCurrentChatId(newChatId);
    setMessages([]);
  };

  const handleSwitchChat = (chatId: string) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentChatId ? { ...session, messages } : session
      )
    );
    setCurrentChatId(chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    if (chatSessions.length === 1) {
      handleNewChat();
    }
    setChatSessions((prev) => {
      const updatedSessions = prev.filter((session) => session.id !== chatId);
      chatHistories.delete(chatId);
      if (chatId === currentChatId && updatedSessions.length > 0) {
        setCurrentChatId(updatedSessions[updatedSessions.length - 1].id);
      }
      return updatedSessions;
    });
    toast({
      title: "Chat Deleted",
      description: "The chat has been removed from your history.",
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => {
      const updatedMessages = [...prev, userMessage];
      setChatSessions((prevSessions) =>
        prevSessions.map((session) =>
          session.id === currentChatId
            ? { ...session, messages: updatedMessages }
            : session
        )
      );
      return updatedMessages;
    });

    if (messages.filter((msg) => msg.role === "user").length === 0) {
      let newTitle = `Chat ${chatSessions.length}`;
      const symbolMatch = input.match(/\b[A-Z]{3}\/[A-Z]{3}\b/)?.[0];
      const indicators = ["rsi", "macd", "ema", "bbands", "adx", "atr", "ichimoku", "stoch", "cci", "mom", "pivot_points_hl"];
      const requestedIndicator = indicators.find((indicator) =>
        input.toLowerCase().includes(indicator)
      );
      if (symbolMatch) {
        const potentialSymbol = symbolMatch.toUpperCase();
        const pair = forexPairs.find((p) => p.symbol === potentialSymbol);
        if (pair) {
          newTitle = requestedIndicator
            ? `${requestedIndicator.toUpperCase()} for ${potentialSymbol}`
            : input.toLowerCase().includes("analyz")
              ? `Analysis for ${potentialSymbol}`
              : `Query for ${potentialSymbol}`;
        }
      }
      if (!newTitle.includes("Analysis for") && !newTitle.includes("Query for")) {
        const pairName = input.toLowerCase().replace(/forex|pair/gi, "").trim();
        const matchedPair = forexPairs.find((p) =>
          p.name?.toLowerCase().includes(pairName)
        );
        if (matchedPair) {
          newTitle = requestedIndicator
            ? `${requestedIndicator.toUpperCase()} for ${matchedPair.symbol}`
            : input.toLowerCase().includes("analyz")
              ? `Analysis for ${matchedPair.symbol}`
              : `Query for ${matchedPair.symbol}`;
        }
      }
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === currentChatId ? { ...session, title: newTitle } : session
        )
      );
    }

    setInput("");
    setLoading(true);

    try {
      const chatHistory = chatHistories.get(currentChatId);
      if (!chatHistory) {
        throw new Error("Chat history not initialized for this session.");
      }
      await chatHistory.addMessage(new HumanMessage(input));

      const systemPrompt = `
        You are an advanced AI Forex Advisor for FinSight AI, a comprehensive financial analysis platform. You are designed to handle ANY forex-related query, analysis request, or report generation for global currency pairs. Your capabilities extend far beyond basic data retrieval to provide sophisticated forex market insights.

        ## CORE CAPABILITIES
        You can handle:
        - **Currency Analysis**: Complete fundamental and technical analysis of forex pairs
        - **Market Research**: Economic impact analysis, central bank policy effects, geopolitical influences
        - **Trading Reports**: Daily forex summaries, volatility analysis, correlation studies
        - **Risk Management**: Position sizing, volatility assessment, correlation analysis
        - **Trading Strategies**: Entry/exit points, trend analysis, momentum strategies
        - **Economic Context**: How global events, interest rates, and economic indicators affect currencies
        - **Comparative Analysis**: Currency strength analysis, cross-pair correlations
        - **Educational Content**: Explain complex forex concepts and trading strategies

        ## COMPREHENSIVE ANALYSIS FRAMEWORK
        
        ### 1. CURRENCY PAIR IDENTIFICATION & VALIDATION
        - **Smart Recognition**: Detect pairs from various formats (EUR/USD, EURUSD, Euro Dollar)
        - **Auto-correction**: Handle common variations and formatting differences
        - **Context Memory**: Remember pairs from conversation history
        - **Flexible Input**: Handle "Euro analysis", "USD strength", "GBP report" formats
        - **Global Coverage**: Support all major, minor, and exotic currency pairs

        ### 2. FOREX DATA INTERPRETATION & ANALYSIS
        **Market Metrics Analysis**:
        - Exchange rates: Current rates, daily/weekly/monthly changes, pip movements
        - Volatility analysis: Average True Range, daily ranges, volatility percentiles
        - Volume analysis: Market participation, institutional flows
        - Correlation analysis: How pairs move relative to each other
        
        **Technical Indicators (Available: RSI, MACD, EMA, BBANDS, ADX, ATR, Ichimoku, STOCH, CCI, MOM, Pivot Points)**:
        - RSI: Momentum oscillator, overbought/oversold conditions for currencies
        - MACD: Trend following, signal line crossovers, momentum shifts
        - EMA: Moving averages, trend confirmation, dynamic support/resistance
        - Bollinger Bands: Volatility bands, currency pair ranging vs trending
        - ADX: Trend strength measurement, directional movement analysis
        - ATR: Volatility measurement, position sizing calculations
        - Ichimoku: Complete trend analysis, cloud support/resistance
        - Stochastic: Momentum oscillator, currency pair momentum
        - CCI: Commodity Channel Index, cyclical analysis
        - Momentum: Rate of change analysis
        - Pivot Points: Key support and resistance levels

        **Social Sentiment Integration**:
        - Reddit forex community analysis: Trader sentiment, market buzz
        - Social momentum: How community sentiment aligns with technical analysis
        - Contrarian signals: When sentiment diverges from price action
        - Geographic sentiment: Regional trading perspectives

        **Market Intelligence Integration**:
        - Real-time news analysis and market alerts
        - Geopolitical event impact assessment on currency pairs
        - Central bank policy and economic indicator analysis
        - Macroeconomic factor influence evaluation
        - Comprehensive market sentiment understanding
        - Cross-market correlation analysis

        ### 3. RESPONSE ADAPTABILITY
        **Query Types & Responses**:
        - **Quick Rates**: "What's EUR/USD at?" → Current rate + key highlights
        - **Analysis Requests**: "Analyze GBP/JPY" → Complete technical + fundamental + sentiment analysis
        - **Economic Impact**: "How do rate hikes affect USD?" → Economic analysis with currency implications
        - **Trading Strategies**: "Best EUR/USD entry point?" → Technical analysis with entry/exit recommendations
        - **Risk Assessment**: "EUR/USD volatility analysis" → Risk metrics and position sizing guidance
        - **Cross-Analysis**: "USD strength today" → Multi-pair USD analysis
        - **Educational**: "Explain carry trades" → Clear educational content with examples
        - **Market Updates**: "Forex market summary" → Comprehensive market overview
        - **Correlation Analysis**: "How does EUR/USD affect GBP/USD?" → Inter-pair relationship analysis

        ### 4. COMPREHENSIVE REPORTING
        **Analysis Depth Levels**:
        - **Quick Summary**: 2-3 key points for rapid trading decisions
        - **Standard Analysis**: Rate, trends, key indicators, sentiment, trading recommendation
        - **Deep Dive**: Comprehensive analysis with multiple timeframes, economic context, risk factors
        - **Custom Reports**: Tailored analysis based on specific trading requirements

        **Professional Formatting**:
        - Use bullet points, headers, and sections for complex analysis
        - Include confidence levels and data freshness indicators
        - Provide actionable trading insights and clear recommendations
        - Always cite data sources and timestamps
        - Include pip targets and risk levels where appropriate

        ### 5. INTELLIGENT ERROR HANDLING
        - **Missing Data**: Explain what's missing and provide analysis with available data
        - **Invalid Pairs**: Suggest closest matches or alternative analysis approaches
        - **API Failures**: Provide general market context or educational content
        - **Ambiguous Requests**: Ask clarifying questions to provide better analysis

        ### 6. CONTEXTUAL INTELLIGENCE
        - **Market Awareness**: Consider current global economic conditions
        - **Session Analysis**: Account for Asian, European, US trading sessions
        - **Economic Calendar**: Reference upcoming economic events when relevant
        - **Cross-Market Analysis**: Connect forex movements with stocks, commodities, bonds
        - **Market Intelligence**: Access real-time news, geopolitical events, and comprehensive market analysis
        - **Global Context**: Understand how worldwide events affect currency pairs
        - **Risk Awareness**: Highlight potential risks and market alerts

        ### 7. RISK & COMPLIANCE
        - Always include risk disclaimers for trading advice
        - Provide balanced analysis showing both opportunities and risks
        - Emphasize proper risk management and position sizing
        - Focus on education and analysis rather than direct trading signals
        - Remind users about leverage risks in forex trading

        ## OUTPUT GUIDELINES
        - **Be Comprehensive**: Address all aspects of the user's query
        - **Be Adaptive**: Match response depth to query complexity
        - **Be Accurate**: Only use provided API data, clearly state limitations
        - **Be Helpful**: Always try to provide value even with limited data
        - **Be Professional**: Maintain expert-level forex communication
        - **Be Educational**: Explain concepts when beneficial for user understanding
        - **Include Market Intelligence**: When available, incorporate real-time news, geopolitical events, and comprehensive market analysis
        - **Contextual Awareness**: Consider global events and their impact on currency pairs
        - **Risk Alerts**: Highlight any urgent market alerts or warnings
        - **Data Integration**: Reference specific data points from all available sources (forex data, indicators, sentiment, market intelligence)

        Remember: You are a sophisticated forex advisor capable of handling any currency-related query with professional-grade analysis. Always reference the specific data provided and explain how different data sources inform your analysis.
      `;

      // Initialize symbol search variables
      let symbol: string | null = null;

      // Pattern 1: Standard forex pair format (EUR/USD, GBP/JPY, etc.)
      const symbolMatch = input.match(/\b[A-Z]{3}\/[A-Z]{3}\b/)?.[0];
      if (symbolMatch) {
        const potentialSymbol = symbolMatch.toUpperCase();
        const pair = forexPairs.find((p) => p.symbol === potentialSymbol);
        if (pair) {
          symbol = potentialSymbol;
        } else {
          // Try fuzzy matching for similar pairs
          const closestSymbol = forexPairs.reduce(
            (closest: { symbol: string; distance: number }, p) => {
              const distance = levenshteinDistance(potentialSymbol.replace("/", ""), p.symbol.replace("/", ""));
              return distance < closest.distance ? { symbol: p.symbol, distance } : closest;
            },
            { symbol: "", distance: Infinity }
          );
          if (closestSymbol.distance <= 2) {
            symbol = closestSymbol.symbol;
          }
        }
      }

      // Pattern 2: Currency name variations and common aliases
      if (!symbol) {
        const currencyAliases: { [key: string]: string } = {
          "eurusd": "EUR/USD",
          "euro dollar": "EUR/USD",
          "eur usd": "EUR/USD",
          "gbpusd": "GBP/USD",
          "pound dollar": "GBP/USD",
          "gbp usd": "GBP/USD",
          "cable": "GBP/USD",
          "usdjpy": "USD/JPY",
          "dollar yen": "USD/JPY",
          "usd jpy": "USD/JPY",
          "usdchf": "USD/CHF",
          "dollar franc": "USD/CHF",
          "usd chf": "USD/CHF",
          "audusd": "AUD/USD",
          "aussie dollar": "AUD/USD",
          "aud usd": "AUD/USD",
          "usdcad": "USD/CAD",
          "dollar loonie": "USD/CAD",
          "usd cad": "USD/CAD",
          "nzdusd": "NZD/USD",
          "kiwi dollar": "NZD/USD",
          "nzd usd": "NZD/USD",
          "eurgbp": "EUR/GBP",
          "euro pound": "EUR/GBP",
          "eur gbp": "EUR/GBP",
          "gbpjpy": "GBP/JPY",
          "pound yen": "GBP/JPY",
          "gbp jpy": "GBP/JPY",
          "eurjpy": "EUR/JPY",
          "euro yen": "EUR/JPY",
          "eur jpy": "EUR/JPY"
        };

        const lowerInput = input.toLowerCase().replace(/[^a-z\s]/g, "");
        for (const [alias, pair] of Object.entries(currencyAliases)) {
          if (lowerInput.includes(alias)) {
            symbol = pair;
            break;
          }
        }
      }

      // Pattern 3: Individual currency mentions with context
      if (!symbol) {
        const currencyMentions = [];
        const currencies = ["EUR", "USD", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];
        const upperInput = input.toUpperCase();

        for (const curr of currencies) {
          if (upperInput.includes(curr)) {
            currencyMentions.push(curr);
          }
        }

        // If exactly 2 currencies mentioned, create pair
        if (currencyMentions.length === 2) {
          const potentialPair = `${currencyMentions[0]}/${currencyMentions[1]}`;
          if (forexPairs.some(p => p.symbol === potentialPair)) {
            symbol = potentialPair;
          } else {
            // Try reverse order
            const reversePair = `${currencyMentions[1]}/${currencyMentions[0]}`;
            if (forexPairs.some(p => p.symbol === reversePair)) {
              symbol = reversePair;
            }
          }
        }
      }

      if (!symbol) {
        const pairName = input.toLowerCase().replace(/forex|pair/gi, "").trim();
        const pair = forexPairs.find((p) => p.name?.toLowerCase().includes(pairName));
        if (pair) {
          symbol = pair.symbol;
        } else {
          const closestPair = forexPairs.reduce(
            (closest: { symbol: string; name: string; distance: number }, p) => {
              const distance = levenshteinDistance(pairName, p.name?.toLowerCase() ?? "");
              return distance < closest.distance ? { symbol: p.symbol, name: p.name ?? "", distance } : closest;
            },
            { symbol: "", name: "", distance: Infinity }
          );
          if (closestPair.distance <= 3) {
            symbol = closestPair.symbol;
          }
        }
      }

      if (!symbol) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          const historySymbolMatch = msg.content.match(/\b[A-Z]{3}\/[A-Z]{3}\b/)?.[0];
          if (historySymbolMatch) {
            const potentialSymbol = historySymbolMatch.toUpperCase();
            const pair = forexPairs.find((p) => p.symbol === potentialSymbol);
            if (pair) {
              symbol = potentialSymbol;
              break;
            }
          }
        }
      }

      // Enhanced forex pair detection and smart suggestions
      if (!symbol) {
        // Try to provide intelligent assistance even without a symbol
        const isGeneralQuery =
          input.toLowerCase().includes("market") ||
          input.toLowerCase().includes("forex") ||
          input.toLowerCase().includes("currency") ||
          input.toLowerCase().includes("general") ||
          input.toLowerCase().includes("overall") ||
          input.toLowerCase().includes("economy") ||
          input.toLowerCase().includes("tips") ||
          input.toLowerCase().includes("advice") ||
          input.toLowerCase().includes("help") ||
          input.toLowerCase().includes("explain") ||
          input.toLowerCase().includes("what is") ||
          input.toLowerCase().includes("how to") ||
          input.toLowerCase().includes("trading");

        let content = "";
        if (isGeneralQuery) {
          content = `I'd be happy to help with your forex question! For general market insights, I can provide:

🌍 **Forex Market Analysis Options:**
• Currency pair overviews (majors, minors, exotics)
• Economic impact analysis and central bank policies
• Trading strategy guidance and risk management
• Technical analysis education and chart patterns
• Market session analysis (Asian, European, US)

🔍 **For Specific Pair Analysis:**
Provide a forex pair (e.g., 'EUR/USD', 'GBP/JPY', 'USD/CHF') or currency name.

📈 **Popular Pairs to Try:**
• EUR/USD (Euro/Dollar), GBP/USD (Pound/Dollar), USD/JPY (Dollar/Yen)
• GBP/JPY (Pound/Yen), EUR/GBP (Euro/Pound), AUD/USD (Aussie/Dollar)
• USD/CAD (Dollar/Loonie), USD/CHF (Dollar/Franc)

What specific aspect of forex would you like me to focus on?`;
        } else {
          // Try to suggest similar symbols from input
          const inputUpper = input.toUpperCase().replace(/[^A-Z]/g, "");
          const similarPairs = forexPairs
            .filter(pair =>
              pair.symbol.replace("/", "").includes(inputUpper.slice(0, 3)) ||
              (pair.name && pair.name.toLowerCase().includes(input.toLowerCase().slice(0, 4)))
            )
            .slice(0, 5)
            .map(pair => `${pair.symbol} (${pair.name || 'Currency Pair'})`)
            .join(", ");

          content = `I couldn't identify a specific forex pair from your message. 

🔍 **Did you mean:**
${similarPairs ? `• ${similarPairs}` : "• Please provide a valid forex pair"}

💡 **Popular Options:**
• EUR/USD (Euro/US Dollar) • GBP/USD (British Pound/US Dollar)
• USD/JPY (US Dollar/Japanese Yen) • GBP/JPY (British Pound/Japanese Yen)
• EUR/GBP (Euro/British Pound) • AUD/USD (Australian Dollar/US Dollar)
• USD/CAD (Dollar/Loonie), USD/CHF (Dollar/Franc)

What forex pair would you like me to analyze?`;
        }

        const errorMessage: Message = {
          role: "assistant",
          content,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => {
          const updatedMessages = [...prev, errorMessage];
          setChatSessions((prevSessions) =>
            prevSessions.map((session) =>
              session.id === currentChatId
                ? { ...session, messages: updatedMessages }
                : session
            )
          );
          return updatedMessages;
        });
        setLoading(false);
        return;
      }

      // Enhanced forex pair validation with suggestions
      if (forexPairs.length > 0) {
        const isValidSymbol = forexPairs.some((pair) => pair.symbol === symbol);
        if (!isValidSymbol) {
          const closestSymbol = forexPairs.reduce(
            (closest: { symbol: string; distance: number }, p) => {
              const distance = levenshteinDistance(symbol!.replace("/", ""), p.symbol.replace("/", "")); // Non-null assertion
              return distance < closest.distance ? { symbol: p.symbol, distance } : closest;
            },
            { symbol: "", distance: Infinity }
          );

          // Find additional similar pairs
          const similarPairs = forexPairs
            .filter(pair =>
              pair.symbol.includes(symbol!.slice(0, 3)) ||
              pair.symbol.startsWith(symbol!.charAt(0)) ||
              (pair.name && pair.name.toLowerCase().includes(symbol!.toLowerCase()))
            )
            .slice(0, 5)
            .map(pair => `${pair.symbol} (${pair.name || 'Currency Pair'})`)
            .join(", ");

          const suggestion = closestSymbol.distance <= 2 ? ` Did you mean '${closestSymbol.symbol}'?` : "";
          const content = `❌ **Forex Pair '${symbol}' not found** in available currency pairs.

🔍 **Did you mean:**
${suggestion || (similarPairs ? `• ${similarPairs}` : "No similar pairs found")}

💡 **Popular Forex Pairs:**
• **Majors**: EUR/USD, GBP/USD, USD/JPY, USD/CHF
• **Crosses**: EUR/GBP, GBP/JPY, EUR/JPY, AUD/CAD
• **Commodities**: AUD/USD, USD/CAD, NZD/USD

📝 **Note:** I analyze all major, minor, and exotic forex pairs. Ensure the format is correct (e.g., EUR/USD).

Please provide a valid forex pair for analysis.`;

          const errorMessage: Message = {
            role: "assistant",
            content,
            timestamp: new Date().toLocaleTimeString(),
          };
          setMessages((prev) => {
            const updatedMessages = [...prev, errorMessage];
            setChatSessions((prevSessions) =>
              prevSessions.map((session) =>
                session.id === currentChatId
                  ? { ...session, messages: updatedMessages }
                  : session
              )
            );
            return updatedMessages;
          });
          setLoading(false);
          return;
        }
      }

      const indicators = ["rsi", "macd", "ema", "bbands", "adx", "atr", "ichimoku", "stoch", "cci", "mom", "pivot_points_hl"];
      const requestedIndicators = indicators.filter((indicator) =>
        input.toLowerCase().includes(indicator)
      );

      // Enhanced data fetching logic for comprehensive forex analysis
      const needsForexData =
        input.toLowerCase().includes("price") ||
        input.toLowerCase().includes("rate") ||
        input.toLowerCase().includes("change") ||
        input.toLowerCase().includes("trend") ||
        input.toLowerCase().includes("analyz") ||
        input.toLowerCase().includes("report") ||
        input.toLowerCase().includes("research") ||
        input.toLowerCase().includes("trade") ||
        input.toLowerCase().includes("trading") ||
        input.toLowerCase().includes("buy") ||
        input.toLowerCase().includes("sell") ||
        input.toLowerCase().includes("recommend") ||
        input.toLowerCase().includes("assessment") ||
        input.toLowerCase().includes("evaluation") ||
        input.toLowerCase().includes("overview") ||
        input.toLowerCase().includes("summary") ||
        input.toLowerCase().includes("how") ||
        input.toLowerCase().includes("what") ||
        input.toLowerCase().includes("performance") ||
        input.toLowerCase().includes("outlook") ||
        input.toLowerCase().includes("volatility") ||
        input.toLowerCase().includes("strength") ||
        input.toLowerCase().includes("weakness") ||
        requestedIndicators.length > 0; // Always fetch forex data if indicators are requested

      // Always fetch comprehensive indicators for analysis, research, or trading queries
      const needsComprehensiveAnalysis =
        input.toLowerCase().includes("analyz") ||
        input.toLowerCase().includes("report") ||
        input.toLowerCase().includes("research") ||
        input.toLowerCase().includes("trade") ||
        input.toLowerCase().includes("trading") ||
        input.toLowerCase().includes("recommend") ||
        input.toLowerCase().includes("assessment") ||
        input.toLowerCase().includes("evaluation") ||
        input.toLowerCase().includes("overview") ||
        input.toLowerCase().includes("comprehensive") ||
        input.toLowerCase().includes("detailed") ||
        input.toLowerCase().includes("full") ||
        input.toLowerCase().includes("complete") ||
        input.toLowerCase().includes("strategy") ||
        input.toLowerCase().includes("position");

      const isGeneralAnalysis = needsComprehensiveAnalysis;

      let forexData: any = undefined;
      let indicatorsData: { [key: string]: { data: any; timestamp: number } } | undefined = undefined;
      let redditData: any = undefined;
      const apiCallCount = { count: 0 };

      // Try to reuse data from chat history to avoid rate limits
      const previousMessageWithData = messages.slice().reverse().find(m => m.role === "assistant" && m.forexData?.quote?.symbol === symbol);
      if (previousMessageWithData) {
        forexData = previousMessageWithData.forexData;
        indicatorsData = previousMessageWithData.indicatorsData;
        redditData = previousMessageWithData.redditData;
      } else if (typeof window !== 'undefined') {
        // Fallback to localStorage from the forex details page
        const cachedStr = localStorage.getItem('finsight_last_viewed_forex');
        if (cachedStr) {
          try {
            const cached = JSON.parse(cachedStr);
            // Check if symbol matches and cache is less than 24 hours old
            if (cached.symbol === symbol && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
              forexData = cached.forexData;
              indicatorsData = cached.technicalIndicators;
              console.log("Reused forex data from localStorage for", symbol);
            }
          } catch(e) {}
        }
      }

      // Fetch only what's needed
      if ((needsForexData || isGeneralAnalysis) && !forexData) {
        const fields = [];
        if (input.toLowerCase().includes("price") || input.toLowerCase().includes("change") || isGeneralAnalysis) {
          fields.push("quote");
        }
        if (input.toLowerCase().includes("trend") || isGeneralAnalysis) {
          fields.push("timeSeries");
        }
        forexData = await fetchForexData(symbol, apiCallCount, fields);
      }

      if ((requestedIndicators.length > 0 || isGeneralAnalysis) && !indicatorsData) {
        const indicatorsToFetch = requestedIndicators.length > 0
          ? requestedIndicators
          : isGeneralAnalysis
            ? ["ema", "rsi", "macd", "bbands", "adx", "atr"] // Comprehensive set for detailed forex analysis
            : []; // Default minimal set
        if (indicatorsToFetch.length > 0) {
          indicatorsData = await fetchIndicators(symbol, indicatorsToFetch, apiCallCount);
        }
      }

      // Fetch Reddit sentiment data
      if (!redditData) {
        try {
          const redditResponse = await fetch(`/api/reddit?symbol=${symbol}`);
        if (redditResponse.ok) {
          redditData = await redditResponse.json();
          console.log(`Successfully fetched Reddit data for forex pair: ${symbol}`);
        } else {
          console.warn(`Failed to fetch Reddit data for ${symbol}`);
        }
        } catch (error) {
          console.warn(`Error fetching Reddit data for ${symbol}:`, error);
          // Continue without Reddit data
        }
      }

      // Fetch comprehensive market intelligence for analysis requests with timeout
      let marketIntelligence: any = null;
      let marketAlerts: any = null;
      if (needsComprehensiveAnalysis || input.toLowerCase().includes("analyz") || input.toLowerCase().includes("report") || input.toLowerCase().includes("research")) {
        try {
          console.log(`Fetching market intelligence for forex pair: ${symbol}`);

          // Add timeout to prevent hanging
          const marketIntelPromise = fetch(`/api/market-intelligence?symbol=${symbol}&type=comprehensive`);
          const marketAlertsPromise = fetch(`/api/market-intelligence?symbol=${symbol}&type=alerts`);

          // Race the promises with a timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Market intelligence request timeout')), 30000) // 30 second timeout
          );

          const marketIntelResponse = await Promise.race([marketIntelPromise, timeoutPromise]) as Response;
          if (marketIntelResponse.ok) {
            marketIntelligence = await marketIntelResponse.json();
            console.log(`Successfully fetched market intelligence for forex pair: ${symbol}`);
          } else if (marketIntelResponse.status === 429) {
            // Handle rate limit error
            console.warn(`Rate limit exceeded when fetching market intelligence for ${symbol}`);
            marketIntelligence = {
              error: "Rate limit exceeded for market intelligence. Please try again later."
            };
          }

          // Fetch market alerts for risk awareness with timeout
          const marketAlertsResponse = await Promise.race([marketAlertsPromise, timeoutPromise]) as Response;
          if (marketAlertsResponse.ok) {
            marketAlerts = await marketAlertsResponse.json();
            console.log(`Successfully fetched market alerts for forex pair: ${symbol}`);
          } else if (marketAlertsResponse.status === 429) {
            // Handle rate limit error
            console.warn(`Rate limit exceeded when fetching market alerts for ${symbol}`);
            marketAlerts = {
              error: "Rate limit exceeded for market alerts. Please try again later."
            };
          }
        } catch (error) {
          console.warn(`Error fetching market intelligence for ${symbol}:`, error);
          // Continue without market intelligence
          // Make sure to reset loading state even if there's an error
          if (error instanceof Error && error.message.includes('timeout')) {
            marketIntelligence = {
              error: "Market intelligence request timed out. Proceeding with available data."
            };
            marketAlerts = {
              error: "Market alerts request timed out. Proceeding with available data."
            };
          }
        }
      }

      // Optimize data size for LLM to prevent rate limit errors
      const optimizedForexData: any = {};

      // Optimize quote data
      if (forexData?.quote) {
        optimizedForexData.quote = {
          symbol: forexData.quote.symbol,
          name: forexData.quote.name,
          price: forexData.quote.price,
          change: forexData.quote.change,
          change_percent: forexData.quote.change_percent,
          volume: forexData.quote.volume,
        };
      }

      // Optimize time series data
      if (forexData?.timeSeries) {
        optimizedForexData.timeSeries = {
          values: forexData.timeSeries.values?.slice(0, 5) // Limit to last 5 data points
        };
      }

      // Optimize indicators data
      if (indicatorsData && !indicatorsData.error) {
        optimizedForexData.indicators = {};
        const indicatorsToSend = (requestedIndicators.length > 0 ? requestedIndicators : ["ema", "rsi", "macd"]).slice(0, 3);
        for (const indicator of indicatorsToSend) {
          if (indicatorsData[indicator]) {
             const value = indicatorsData[indicator];
             if (Array.isArray(value)) {
               optimizedForexData.indicators[indicator] = value.slice(0, 2);
             } else if (typeof value === 'object' && value !== null) {
               optimizedForexData.indicators[indicator] = {};
               for (const [subKey, subValue] of Object.entries(value)) {
                   if (Array.isArray(subValue)) {
                       optimizedForexData.indicators[indicator][subKey] = subValue.slice(0, 2);
                   }
               }
             }
          }
        }
      }

      // Optimize Reddit sentiment data
      if (redditData) {
        optimizedForexData.redditSentiment = {
          symbol: redditData.symbol,
          bullish_percentage: redditData.bullish_percentage,
          bearish_percentage: redditData.bearish_percentage,
          total_posts: redditData.total_posts,
          overall_sentiment: redditData.overall_sentiment,
          confidence: redditData.confidence
        };
      }

      // Optimize market intelligence data
      if (marketIntelligence) {
        optimizedForexData.marketIntelligence = {
          symbol: marketIntelligence.symbol,
          error: marketIntelligence.error,
          // Only send the analysis, not the raw results which can be large
          synthesizedAnalysis: marketIntelligence.synthesizedAnalysis || marketIntelligence.analysis
        };
        // Limit the size of the market intelligence analysis
        if (optimizedForexData.marketIntelligence.synthesizedAnalysis && optimizedForexData.marketIntelligence.synthesizedAnalysis.length > 1000) {
          optimizedForexData.marketIntelligence.synthesizedAnalysis = optimizedForexData.marketIntelligence.synthesizedAnalysis.substring(0, 1000) + '... (analysis truncated)';
        }
      }

      // Optimize market alerts data
      if (marketAlerts) {
        optimizedForexData.marketAlerts = {
          symbol: marketAlerts.symbol,
          error: marketAlerts.error,
          alerts: marketAlerts.alerts
        };
      }

      // Limit the size of the data being sent to prevent rate limit errors
      const serializedData = JSON.stringify(optimizedForexData);
      const limitedData = serializedData.length > 2000
        ? serializedData.substring(0, 2000) + '... (data truncated to prevent rate limit)'
        : serializedData;

      // Only include chat history for complex analysis requests
      const shouldIncludeChatHistory = input.toLowerCase().includes("analyz") || input.toLowerCase().includes("report") || input.toLowerCase().includes("research");
      const recentChatHistory = shouldIncludeChatHistory ? messages.slice(-1) : [];
      const chatHistoryString = shouldIncludeChatHistory
        ? `\n\nRecent Chat History: ${JSON.stringify(recentChatHistory)}`
        : '';

      const enhancedInput = `${input}\n\nAPI Data: ${limitedData}${chatHistoryString}`;

      const rawHistory = await chatHistory.getMessages();
      const formattedHistory = rawHistory.slice(-4).map(msg => ({
        role: msg.constructor.name === "HumanMessage" ? "user" : "assistant",
        content: msg.content.toString()
      }));

      const response = await generateChatResponse(enhancedInput, formattedHistory, systemPrompt, 0.5);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      // Add assistant response to UI immediately
      const assistantMessage: Message = {
        role: "assistant",
        content: response.content as string,
        timestamp: new Date().toLocaleTimeString(),
        forexData,
        indicatorsData,
        redditData,
      };

      // Add market intelligence data if available
      if (marketIntelligence) {
        (assistantMessage as any).marketIntelligence = marketIntelligence;
      }
      if (marketAlerts) {
        (assistantMessage as any).marketAlerts = marketAlerts;
      }

      setMessages((prev) => {
        const updatedMessages = [...prev, assistantMessage];
        setChatSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === currentChatId
              ? { ...session, messages: updatedMessages }
              : session
          )
        );
        return updatedMessages;
      });

      await chatHistory.addMessage(new SystemMessage(response.content as string));
      
      // Save analysis to database history
      if (symbol) {
        try {
          fetch('/api/analysis-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: symbol,
              assetType: 'forex',
              dataSnapshot: optimizedForexData,
              analysis: response.content as string,
            }),
          }).catch(err => console.warn('Failed to save analysis history:', err));
        } catch (e) {
          console.warn('Failed to save analysis history:', e);
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error in chatbot:", errorMessage);

      // Enhanced error handling with intelligent fallback for forex
      let fallbackContent = "";

      // Determine error type and provide appropriate fallback
      if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorMessage.includes("timeout")) {
        fallbackContent = `🌐 **Network Issue Detected**

I'm experiencing connectivity issues: ${errorMessage}

💡 **What I can still help with:**
• Explain forex concepts and terminology
• Discuss currency trading strategies and risk management
• Provide market analysis framework guidance
• Share forex psychology and trading insights
• Explain technical indicators for forex trading
• Currency correlation analysis concepts

🔄 **Troubleshooting:**
• Please check your internet connection
• Try again in a few moments
• Consider asking general forex questions

I'm here to help with forex education even without real-time data!`;
      } else if (errorMessage.includes("API") || errorMessage.includes("key") || errorMessage.includes("quota")) {
        fallbackContent = `⚙️ **API Service Issue**

There's a temporary service limitation: ${errorMessage}

📚 **Educational Content Available:**
• Forex market fundamentals and structure
• Currency pair analysis principles
• Technical analysis for forex trading
• Risk management in forex markets
• Economic indicators impact on currencies
• Central bank policies and forex effects

💬 **Ask me about:**
• "How do interest rates affect forex?"
• "What is carry trading?"
• "Explain forex market sessions"
• "How to read forex charts?"

Let's continue with forex education while the service recovers!`;
      } else {
        fallbackContent = `🔧 **Technical Issue Encountered**

I encountered an unexpected error: ${errorMessage}

🎯 **Alternative Assistance:**
• General forex market analysis concepts
• Currency trading strategy discussions
• Forex risk management principles
• Technical analysis education for forex
• Economic calendar and news impact
• Cross-currency analysis techniques

💭 **Try asking:**
• "Explain forex spreads and pips"
• "What are major vs minor pairs?"
• "How to analyze currency strength?"
• "Forex position sizing strategies"

I'm still here to help with your forex learning journey!`;
      }

      toast({
        title: "Service Issue",
        description: "Providing alternative forex assistance while resolving the issue.",
        variant: "destructive",
      });

      const errorMsg: Message = {
        role: "assistant",
        content: fallbackContent,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => {
        const updatedMessages = [...prev, errorMsg];
        setChatSessions((prevSessions) =>
          prevSessions.map((session) =>
            session.id === currentChatId
              ? { ...session, messages: updatedMessages }
              : session
          )
        );
        return updatedMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = Array(b.length + 1)
      .fill(null)
      .map(() => Array(a.length + 1).fill(0));

    for (let i = 0; i <= b.length; i++) {
      matrix[i][0] = i;
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border/20 bg-background/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={toggleSidebar} className="lg:hidden">
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">FinSight AI Forex</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/choose-market">
                <Button variant="ghost" className="hover:bg-green-500/10">All Markets</Button>
              </Link>
              <Link href="/forexs">
                <Button variant="ghost" className="hover:bg-green-500/10">Forex Market</Button>
              </Link>
              <Link href="/choose-advisor">
                <Button variant="ghost" className="hover:bg-green-500/10">Other Advisors</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-green-500/20 hover:bg-green-500/10 text-green-600">Back Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-64 border-r p-4 flex flex-col lg:w-80 overflow-hidden"
              style={{ backgroundColor: "var(--background)" }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold" style={{ color: emerald600 }}>Chat History</h2>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden" style={{ color: emerald600 }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleNewChat}
                  className="mb-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:opacity-90 w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> New Chat
                </Button>
              </motion.div>
              <div className="flex-1 overflow-y-auto">
                {chatSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    whileHover={{ scale: 1.02 }}
                    className={`flex justify-between items-center p-2 rounded-lg mb-2 cursor-pointer ${session.id === currentChatId ? "bg-green-100 dark:bg-green-900" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    <div className="flex-1" onClick={() => handleSwitchChat(session.id)}>
                      <span className="text-sm font-medium" style={{ color: emerald600 }}>{session.title}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteChat(session.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {forexPairsError && (
              <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-lg mb-4">{forexPairsError}</div>
            )}
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-lg shadow-md ${message.role === "user"
                    ? "text-white bg-gradient-to-r from-green-600 to-emerald-600"
                    : "bg-card text-card-foreground border border-green-500/10"
                    }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      // Skip empty lines
                      if (!line.trim()) return null;

                      // Check for markdown headings
                      if (line.startsWith('#### ')) {
                        return <h4 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(5)}</h4>;
                      } else if (line.startsWith('### ')) {
                        return <h3 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>;
                      } else if (line.startsWith('# ')) {
                        return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                      } else if (line.startsWith('- ')) {
                        return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
                      } else if (line.match(/^\d+\./)) {
                        return <li key={i} className="ml-4 list-decimal">{line.slice(line.indexOf('.') + 2)}</li>;
                      } else if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="mb-2"><strong>{line.slice(2, -2)}</strong></p>;
                      } else if (line.startsWith('*') && line.endsWith('*')) {
                        return <p key={i} className="mb-2"><em>{line.slice(1, -1)}</em></p>;
                      } else {
                        // Regular paragraph
                        return <p key={i} className="mb-2">{line}</p>;
                      }
                    })}
                  </div>

                  {/* Display additional data if available */}
                  {message.role === "assistant" && (message.forexData || message.indicatorsData || message.redditData || (message as any).marketIntelligence || (message as any).marketAlerts) && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <details className="text-xs">
                        <summary className="cursor-pointer font-medium text-green-600 dark:text-green-400">
                          View Additional Data Sources
                        </summary>
                        <div className="mt-2 space-y-3">
                          {message.forexData && (
                            <div>
                              <h4 className="font-semibold">Forex Data</h4>
                              <pre className="text-xs overflow-x-auto bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                {JSON.stringify(message.forexData, null, 2)}
                              </pre>
                            </div>
                          )}
                          {message.indicatorsData && (
                            <div>
                              <h4 className="font-semibold">Technical Indicators</h4>
                              <pre className="text-xs overflow-x-auto bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                {JSON.stringify(message.indicatorsData, null, 2)}
                              </pre>
                            </div>
                          )}
                          {message.redditData && (
                            <div>
                              <h4 className="font-semibold">Reddit Sentiment</h4>
                              <div className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                <p><strong>Symbol:</strong> {message.redditData.symbol}</p>
                                <p><strong>Bullish:</strong> {message.redditData.bullish_percentage}%</p>
                                <p><strong>Bearish:</strong> {message.redditData.bearish_percentage}%</p>
                                <p><strong>Total Posts:</strong> {message.redditData.total_posts}</p>
                                <p><strong>Sentiment:</strong> {message.redditData.overall_sentiment}</p>
                              </div>
                            </div>
                          )}
                          {(message as any).marketIntelligence && (
                            <div>
                              <h4 className="font-semibold">Market Intelligence</h4>
                              <div className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                {((message as any).marketIntelligence as any).synthesizedAnalysis ? (
                                  <div>
                                    <p className="font-medium mb-1">Synthesized Analysis:</p>
                                    <p className="whitespace-pre-wrap">{((message as any).marketIntelligence as any).synthesizedAnalysis}</p>
                                  </div>
                                ) : ((message as any).marketIntelligence as any).analysis ? (
                                  <div>
                                    <p className="font-medium mb-1">Analysis:</p>
                                    <p className="whitespace-pre-wrap">{((message as any).marketIntelligence as any).analysis}</p>
                                  </div>
                                ) : (
                                  <pre className="overflow-x-auto">
                                    {JSON.stringify((message as any).marketIntelligence, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          )}
                          {(message as any).marketAlerts && (
                            <div>
                              <h4 className="font-semibold">Market Alerts</h4>
                              <div className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                {((message as any).marketAlerts as any).alerts ? (
                                  <div>
                                    <p className="font-medium mb-1">Alerts:</p>
                                    <p className="whitespace-pre-wrap">{((message as any).marketAlerts as any).alerts}</p>
                                  </div>
                                ) : (
                                  <pre className="overflow-x-auto">
                                    {JSON.stringify((message as any).marketAlerts, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  )}

                  <span className="text-xs mt-2 block" style={{ color: message.role === "user" ? "white" : "#6B7280" }}>
                    <Clock className="h-3 w-3 inline mr-1" /> {message.timestamp}
                  </span>
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: emerald600 }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4" style={{ background: `linear-gradient(to bottom, var(--background), var(--muted))` }}>
            <div className="flex space-x-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  onClick={handleClearChat}
                  style={{ borderColor: green500, color: green500 }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Clear Chat
                </Button>
              </motion.div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about a forex pair (e.g., 'Analyze EUR/USD', 'What's the RSI for GBP/JPY?')"
                className="flex-1 resize-none shadow-md"
                rows={2}
                style={{ borderColor: green500, backgroundColor: "var(--background)", color: "var(--foreground)" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleSendMessage}
                  disabled={loading}
                  style={{ background: `linear-gradient(to right, ${green500}, ${emerald600})`, color: "white" }}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
