"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/frontend/ui/button";
import { ArrowLeft, Loader2, BarChart3, Home } from "lucide-react"; // Added BarChart3, Home
import { ChartSkeleton } from "@/frontend/ui/skeleton";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link"; // Added Link

// Lazy load heavy chart components
const PortfolioAnalytics = dynamic(() => import("@/frontend/charts/PortfolioAnalytics").then(mod => mod.PortfolioAnalytics), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const CorrelationMatrix = dynamic(() => import("@/frontend/charts/CorrelationMatrix").then(mod => mod.CorrelationMatrix), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const MarketHeatmap = dynamic(() => import("@/frontend/charts/MarketHeatmap").then(mod => mod.MarketHeatmap), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

interface Holding {
  symbol: string;
  assetType: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  notes?: string;
}

interface Portfolio {
  id: string; // Updated to id (Prisma)
  name: string;
  description?: string;
  holdings: Holding[];
}

export default function PortfolioAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    } else if (status === "authenticated" && params.id) {
      fetchPortfolio();
    }
  }, [status, params.id, router]);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`/finsight-ai/api/portfolio/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      } else {
        router.push("/portfolio");
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

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

      {/* Header */}
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold">{portfolio.name} Analytics</h1>
            {portfolio.description && (
              <p className="text-muted-foreground mt-2">{portfolio.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/portfolio/${params.id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
        </motion.div>

        {/* Analytics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {portfolio.holdings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No holdings in this portfolio yet. Add some holdings to see analytics.
              </p>
              <Button onClick={() => router.push(`/portfolio/${params.id}`)}>
                Go to Portfolio
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <PortfolioAnalytics
                holdings={portfolio.holdings}
                portfolioName={portfolio.name}
              />

              {/* Correlation Matrix */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <CorrelationMatrix
                  assets={portfolio.holdings.map(h => h.symbol)}
                />
              </motion.div>

              {/* Market Heatmap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <MarketHeatmap />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
