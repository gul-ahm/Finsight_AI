"use client";

import { useAuth } from '@/frontend/hooks/useAuth';
import { useUserAssets } from '@/frontend/hooks/useUserAssets';
import { usePortfolio } from '@/frontend/hooks/usePortfolio';
import { Button } from '@/frontend/ui/button';
import { Card } from "@/frontend/ui/card";
import {
  BarChart3,
  ChevronRight,
  TrendingUp,
  Wallet,
  Newspaper,
  Bot,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Activity,
  Zap,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DashboardPage() {
  const { session } = useAuth();
  const { watchlist } = useUserAssets();
  const { totalBalance, dailyChange, isLoading: isPortfolioLoading } = usePortfolio();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Greeting Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end mb-8"
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {greeting}, {session?.user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-2">Here's your market overview for today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/choose-advisor">
            <Button className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20">
              <Bot className="w-4 h-4 mr-2" />
              Ask AI Advisor
            </Button>
          </Link>
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Customize Layout
          </Button>
        </div>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">

        {/* Main Portfolio Summary - Large Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 md:row-span-2"
        >
          <Card className="h-full p-6 bg-card/40 backdrop-blur-xl border-primary/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Wallet className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground/80">Total Balance</h3>
                </div>
                {isPortfolioLoading ? (
                  <div className="h-12 w-48 bg-muted/20 animate-pulse rounded mt-4" />
                ) : (
                  <div className="text-5xl font-bold tracking-tight mt-4">
                    {formatCurrency(totalBalance)}
                  </div>
                )}

                <div className={`flex items-center gap-2 mt-2 ${dailyChange.percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <TrendingUp className={`w-4 h-4 ${dailyChange.percentage < 0 ? 'rotate-180' : ''}`} />
                  <span className="font-medium">
                    {dailyChange.percentage >= 0 ? '+' : ''}{dailyChange.percentage.toFixed(2)}%
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({formatCurrency(dailyChange.value)}) today
                  </span>
                </div>
              </div>

              {/* Mini Chart Placeholder (Dynamic or Synthetic) */}
              <div className="mt-8 h-32 w-full bg-gradient-to-t from-primary/10 to-transparent rounded-lg border-b border-primary/20 flex items-end px-2 space-x-1">
                {[40, 60, 45, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/40 hover:bg-primary/60 transition-colors rounded-t-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Market Movers - Medium Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-1"
        >
          <Card className="h-full p-6 bg-card/40 backdrop-blur-xl border-primary/10 flex flex-col justify-between hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1 rounded">+ Top Mover</span>
            </div>
            <div>
              <h3 className="text-sm text-muted-foreground mb-1">NVDA</h3>
              <div className="text-2xl font-bold">$925.30</div>
              <div className="text-sm text-green-500 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                +2.2%
              </div>
            </div>
          </Card>
        </motion.div>

        {/* News Flash - Medium Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-1"
        >
          <Link href="/news">
            <Card className="h-full p-6 bg-card/40 backdrop-blur-xl border-primary/10 flex flex-col justify-between hover:bg-card/60 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Newspaper className="w-5 h-5 text-blue-500" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <div>
                <h3 className="text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                  Market Analysis: AI Sector Boom Continues as Tech Giants Report Earnings
                </h3>
                <span className="text-xs text-muted-foreground">MarketWatch • 1h ago</span>
              </div>
            </Card>
          </Link>
        </motion.div>

        {/* Watchlist - Vertical Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-1 md:row-span-2"
        >
          <Card className="h-full p-6 bg-card/40 backdrop-blur-xl border-primary/10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Watchlist
              </h3>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {watchlist.length > 0 ? watchlist.map((symbol, i) => (
                <div key={symbol} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors border border-transparent hover:border-primary/20 cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                    <div>
                      <div className="font-bold">{symbol}</div>
                      <div className="text-xs text-muted-foreground">Asset</div>
                    </div>
                  </div>
                  {/* Note: In a real app we'd fetch prices for these too, specific to the list */}
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">View</span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground text-sm py-4">No assets in watchlist</div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions - Medium Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="md:col-span-1"
        >
          <Card className="h-full p-4 bg-gradient-to-br from-primary/20 to-purple-600/20 border-primary/10 flex flex-col justify-center items-center text-center gap-3">
            <div className="p-3 rounded-full bg-background/50 backdrop-blur-sm border border-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Upgrade to Pro</h3>
              <p className="text-xs text-muted-foreground mt-1">Unlock advanced AI analysis</p>
            </div>
            <Button size="sm" className="w-full mt-2 bg-primary hover:bg-primary/90">Upgrade</Button>
          </Card>
        </motion.div>

        {/* AI Advisor Teaser - Wide Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="md:col-span-2"
        >
          <Link href="/choose-advisor">
            <Card className="h-full p-6 bg-card/40 backdrop-blur-xl border-primary/10 flex items-center justify-between hover:bg-card/60 transition-colors cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Bot className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold group-hover:text-purple-400 transition-colors">AI Investment Monitor</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">Your AI advisor suggests rebalancing your portfolio based on recent market volatility.</p>
                </div>
              </div>
              <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                Review <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </Card>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
