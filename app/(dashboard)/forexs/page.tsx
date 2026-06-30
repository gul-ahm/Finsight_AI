"use client";

import { useState, useEffect, useCallback, MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from '@/frontend/ui/card';
import { Button } from '@/frontend/ui/button';
import { Input } from "@/frontend/ui/input";
import {
  Loader2,
  Search,
  MessageCircle,
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Globe,
  Filter,
  TrendingDown,
  Minus,
  Plus,
  Star,
  BarChart3 // Added
} from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import Link from "next/link";
import { debounce } from "lodash";
import { AddToPortfolioDialog } from "@/frontend/AddToPortfolioDialog";
import { AddToWatchlistDialog } from "@/frontend/AddToWatchlistDialog"; // Added Import
import { marketThemes } from "@/backend/themes";

interface ForexPair {
  symbol: string;
  name: string;
  exchange: string;
  status: string; // Represents currency_group (e.g., "Major", "Exotic")
  base_currency?: string;
  quote_currency?: string;
  price?: string;
  change?: string;
  percent_change?: string;
}

interface ForexResponse {
  pairs: ForexPair[];
  totalCount: number;
}

// Get trend indicator with color coding
const getTrendInfo = (value: number | string | undefined) => {
  if (value === undefined || value === null) return { icon: <Minus className="w-4 h-4" />, color: "text-gray-500" };
  const number = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(number)) return { icon: <Minus className="w-4 h-4" />, color: "text-gray-500" };

  if (number > 0) {
    return { icon: <TrendingUp className="w-4 h-4" />, color: "text-green-500" };
  } else if (number < 0) {
    return { icon: <TrendingDown className="w-4 h-4" />, color: "text-red-500" };
  }
  return { icon: <Minus className="w-4 h-4" />, color: "text-gray-500" };
};

export default function Forex() {
  const [allForexPairs, setAllForexPairs] = useState<ForexPair[]>([]);
  const [filteredForexPairs, setFilteredForexPairs] = useState<ForexPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [typeOptions, setTypeOptions] = useState<string[]>([]);

  // Portfolio Dialog State
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedForexPair, setSelectedForexPair] = useState<ForexPair | null>(null);

  // Watchlist Dialog State
  const [isWatchDialogOpen, setIsWatchDialogOpen] = useState(false);
  const [selectedWatchForexPair, setSelectedWatchForexPair] = useState<ForexPair | null>(null);

  const { toast } = useToast();
  const perPage = 50;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const theme = marketThemes.forex;

  // Fetch Forex pairs
  const fetchForexPairs = useCallback(async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
      const response = await fetch(
        `/finsight-ai/api/forexs?page=${page}&perPage=${perPage}&currencyGroup=${encodeURIComponent(
          selectedType
        )}&searchQuery=${encodeURIComponent(searchQuery)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `HTTP error! Status: ${response.status}`);
      }
      const data: ForexResponse = await response.json();

      const pairs = data.pairs ?? [];
      setAllForexPairs(pairs);
      setFilteredForexPairs(pairs);
      setTotalCount(data.totalCount ?? 0);
      setTotalPages(Math.ceil((data.totalCount ?? 0) / perPage));

      // Fetch filter options from the first page (without filters) if not already set
      if (typeOptions.length === 0) {
        if (selectedType === "All" && searchQuery === "" && pairs.length > 0) {
          const types = Array.from(
            new Set(pairs.map((pair: ForexPair) => pair.status ?? "Unknown"))
          ).sort();
          setTypeOptions(["All", ...types]);
        } else {
          const optionsResponse = await fetch(`/finsight-ai/api/forexs?page=1&perPage=${perPage}`);
          if (optionsResponse.ok) {
            const optionsData: ForexResponse = await optionsResponse.json();
            const types = Array.from(
              new Set((optionsData.pairs ?? []).map((pair: ForexPair) => pair.status ?? "Unknown"))
            ).sort();
            setTypeOptions(["All", ...types]);
          } else {
            console.warn("Failed to fetch type options, using defaults.");
            setTypeOptions(["All", "Major", "Exotic", "Minor"]);
          }
        }
      }

      if (pairs.length === 0) {
        toast({
          title: "Warning",
          description: "No forex pairs found. Check your filters.",
          variant: "default",
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Fetch error:", errorMessage);
      setAllForexPairs([]);
      setFilteredForexPairs([]);
      setTotalCount(0);
      setTotalPages(1);
      toast({
        title: "Error",
        description: errorMessage || "Failed to fetch forex listings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, selectedType, searchQuery, toast, typeOptions.length, perPage]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchForexPairs();
  }, [fetchForexPairs]);

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
      setPage(1);
    }, 1000),
    []
  );

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setPage(1);
  };

  // Function to check if a Forex pair is supported
  const checkPairSupport = async (symbol: string): Promise<boolean> => {
    try {
      const response = await fetch(`/finsight-ai/api/forex?symbol=${symbol}`);
      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const errorData = await response.json();
        return false;
      }
      return true;
    } catch (error: unknown) {
      console.error(`Error checking support for ${symbol}:`, error);
      return false;
    }
  };

  // Handle the "Analyze" button click
  const handleAnalyzeClick = async (symbol: string, e: MouseEvent<HTMLAnchorElement>) => {
    const isSupported = await checkPairSupport(symbol);
    if (!isSupported) {
      toast({
        title: "Note",
        description: `Availability for ${symbol} may be limited.`,
        variant: "default",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90"></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute top-20 right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-40 h-40 rounded-full bg-primary/10 blur-3xl"></div>
        </div>
      </div>

      {/* Global Header */}
      <header className="relative z-10 border-b border-border/20 bg-background/50 backdrop-blur-md">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-400 rounded-full blur opacity-30"></div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">FinSight AI</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/news">
                <Button variant="ghost" className="hover:bg-primary/10">News</Button>
              </Link>
              <Link href="/choose-market">
                <Button variant="ghost" className="hover:bg-primary/10">Markets</Button>
              </Link>
              <Link href="/choose-advisor">
                <Button variant="ghost" className="hover:bg-primary/10">Advisors</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-primary/20 hover:bg-primary/10">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto space-y-6 p-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative bg-card/80 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-600/5"></div>
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                      Forex Market
                    </h1>
                    <p className="text-muted-foreground mt-1">Explore and analyze foreign exchange pairs</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/forexadvisor">
                    <Button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <span className="relative z-10 flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        <span className="hidden sm:inline">Ask AI Advisor</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative bg-card border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-600/5"></div>
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-400" />
                  <Input
                    type="text"
                    placeholder="Search forex pairs by symbol or name..."
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 h-12 bg-background border border-input focus:border-green-500 focus:ring-green-500 text-foreground placeholder-muted-foreground rounded-xl shadow-sm"
                  />
                </div>

                {/* Type Filter (Currency Group) */}
                <div className="flex items-center gap-2 bg-secondary px-4 rounded-xl">
                  <Filter className="h-5 w-5 text-green-500" />
                  <label htmlFor="type-filter" className="text-sm font-medium text-foreground whitespace-nowrap">
                    Currency Group:
                  </label>
                  <select
                    id="type-filter"
                    value={selectedType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="border-0 bg-transparent py-2 text-foreground focus:ring-0 focus:ring-green-500"
                    disabled={loading}
                  >
                    {typeOptions.map((type) => (
                      <option key={type} value={type} className="text-foreground bg-background">
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={fetchForexPairs}
                  disabled={loading}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-2 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="hidden sm:inline">Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-5 w-5" />
                        <span className="hidden sm:inline">Refresh</span>
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Forex Listings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <Card className="relative bg-card border-0 shadow-xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-600/5"></div>
            <CardContent className="relative p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <Globe className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent">
                    {searchQuery ? `Search Results (Page ${page})` : `Top Forex Listings (Page ${page})`}
                  </h2>
                </div>
                <Button
                  onClick={fetchForexPairs}
                  disabled={loading}
                  variant="outline"
                  className="border-input text-foreground hover:bg-accent rounded-xl"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh Data
                </Button>
              </div>

              {/* Responsive Grid for Forex Listings */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredForexPairs.length > 0 ? (
                    filteredForexPairs.map((pair, index) => (
                      <motion.div
                        key={pair.symbol}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-all duration-300 p-4 bg-card"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-green-600">{pair.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{pair.name}</p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${pair.status === "Major"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : pair.status === "Minor"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                              }`}
                          >
                            {pair.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Base</p>
                            <p className="text-sm font-medium text-foreground">{pair.base_currency || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Quote</p>
                            <p className="text-sm font-medium text-foreground">{pair.quote_currency || "N/A"}</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedForexPair(pair);
                              setIsAddDialogOpen(true);
                            }}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>

                          {/* WATCH BUTTON */}
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWatchForexPair(pair);
                              setIsWatchDialogOpen(true);
                            }}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Watch
                          </Button>

                          <Link
                            href={`/forex/${encodeURIComponent(pair.symbol)}`}
                            onClick={(e) => handleAnalyzeClick(pair.symbol, e)}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full group relative overflow-hidden rounded-lg border-input text-foreground hover:bg-accent transition-all"
                            >
                              <span className="relative z-10 flex items-center justify-center gap-1">
                                Analyze
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </span>
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Globe className="h-12 w-12 text-gray-300 mb-3 dark:text-gray-800" />
                        <p className="text-lg font-medium">No forex pairs found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                      </div>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <Button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  variant="outline"
                  className="border-input text-foreground hover:bg-accent rounded-xl px-6"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Page</span>
                  <div className="rounded-lg px-3 py-1 font-semibold bg-secondary text-secondary-foreground">
                    {page}
                  </div>
                  <span className="font-medium text-foreground">of</span>
                  <div className="rounded-lg px-3 py-1 font-semibold bg-secondary text-secondary-foreground">
                    {totalPages}
                  </div>
                </div>
                <Button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  variant="outline"
                  className="border-input text-foreground hover:bg-accent rounded-xl px-6"
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add to Portfolio Dialog */}
        {selectedForexPair && (
          <AddToPortfolioDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            asset={{
              symbol: selectedForexPair.symbol,
              name: selectedForexPair.name,
              type: "forex",
              exchange: selectedForexPair.exchange,
            }}
          />
        )}

        {/* Add to Watchlist Dialog */}
        {selectedWatchForexPair && (
          <AddToWatchlistDialog
            open={isWatchDialogOpen}
            onOpenChange={setIsWatchDialogOpen}
            asset={{
              symbol: selectedWatchForexPair.symbol,
              name: selectedWatchForexPair.name,
              type: "forex",
            }}
          />
        )}
      </div>
    </div>
  );
}
