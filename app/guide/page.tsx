"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/frontend/ui/button";
import { Card } from "@/frontend/ui/card";
import {
    BarChart3,
    Brain,
    Wallet,
    ArrowRight,
    CheckCircle2,
    Zap,
    LayoutDashboard,
    TrendingUp,
    BookOpen,
    Shield,
    Search,
    AlertTriangle,
    HelpCircle,
    MousePointerClick
} from "lucide-react";
import Link from "next/link";

const sections = [
    { id: "intro", title: "Introduction", icon: BookOpen },
    { id: "getting-started", title: "Getting Started", icon: CheckCircle2 },
    { id: "dashboard", title: "Dashboard Tour", icon: LayoutDashboard },
    { id: "market", title: "Market Intelligence", icon: BarChart3 },
    { id: "advisors", title: "AI Advisors", icon: Brain },
    { id: "trading", title: "Trading Engine", icon: TrendingUp },
    { id: "portfolio", title: "Portfolio Management", icon: Wallet },
];

export default function GuidePage() {
    const [activeSection, setActiveSection] = useState("intro");

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar Navigation */}
            <aside className="w-72 hidden lg:flex flex-col fixed left-0 top-0 bottom-0 border-r border-white/5 bg-background/50 backdrop-blur-xl z-20 p-6 overflow-y-auto">
                <Link href="/" className="flex items-center gap-2 mb-10">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    <span className="font-bold text-xl">FinSight.AI</span>
                </Link>
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contents</h3>
                    <nav className="space-y-1 flex-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => scrollToSection(section.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${activeSection === section.id
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                                    }`}
                            >
                                <section.icon className="w-4 h-4 flex-shrink-0" />
                                {section.title}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto pt-6 border-t border-white/5">
                    <Button asChild className="w-full bg-primary hover:bg-primary/90">
                        <Link href="/auth/signup">Launch App</Link>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 relative">
                <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] opacity-[0.05]" />

                <div className="max-w-4xl mx-auto px-6 py-20 lg:py-24 space-y-32">

                    {/* Introduction */}
                    <section id="intro" className="scroll-mt-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                                <BookOpen className="w-4 h-4 mr-2" />
                                Official Documentation
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6">
                                Mastering <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">FinSight AI</span>
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mb-8">
                                Welcome to FinSight AI. This comprehensive manual is designed to transform you from a novice user into a power user.
                                Whether you are tracking global markets, simulating trades, or relying on our AI for predictive analysis, this guide covers every pixel of the platform.
                            </p>
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm flex gap-3">
                                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                                <p>
                                    <strong>Note:</strong> FinSight AI includes a powerful <strong>Paper Trading Simulator</strong>.
                                    All trades executed on this platform are virtual, allowing you to practice strategies risk-free before applying them in the real world.
                                </p>
                            </div>
                        </motion.div>
                    </section>

                    {/* Getting Started */}
                    <section id="getting-started" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-cyan-400" /> Getting Started
                        </h2>
                        <div className="space-y-12">

                            {/* Step 1 */}
                            <div className="relative pl-8 border-l-2 border-primary/20">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                                <h3 className="text-2xl font-semibold mb-4">1. Account Creation & Security</h3>
                                <p className="text-muted-foreground mb-4">
                                    FinSight AI uses secure, server-side authentication (NextAuth). Your data is encrypted and isolated.
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                                    <li>Navigate to the <Link href="/auth/signup" className="text-primary hover:underline">Sign Up</Link> page.</li>
                                    <li>Enter a valid email address (we support Gmail, Outlook, Yahoo).</li>
                                    <li>Create a strong password (min 12 chars, alphanumeric).</li>
                                    <li>Once registered, you are automatically logged in to your secure session.</li>
                                </ul>
                            </div>

                            {/* Step 2 */}
                            <div className="relative pl-8 border-l-2 border-white/10">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white/20" />
                                <h3 className="text-2xl font-semibold mb-4">2. The "Zero-Setup" Philosophy</h3>
                                <p className="text-muted-foreground">
                                    Unlike traditional terminals that require complex API keys, FinSight comes pre-configured.
                                    We pull public market data automatically. You do <strong>not</strong> need to connect an exchange account to start analyzing.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Dashboard Tour */}
                    <section id="dashboard" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-purple-400" /> Dashboard Tour
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Your command center is divided into three critical zones. Understanding these will speed up your workflow significantly.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="p-6 border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                <h4 className="font-bold text-lg mb-2 text-primary">1. The Asset Watchlist</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Located on the left/top. This creates a shortcut to your favorite assets.
                                </p>
                                <div className="text-xs text-muted-foreground bg-black/20 p-3 rounded border border-white/5">
                                    <strong className="text-white">Action:</strong> Click the "Star" icon on any asset page to add it here instantly.
                                </div>
                            </Card>

                            <Card className="p-6 border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                <h4 className="font-bold text-lg mb-2 text-pink-400">2. Portfolio Summary</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    The central aggregate view. It sums up your Crypto, Stock, and Cash balances.
                                </p>
                                <div className="text-xs text-muted-foreground bg-black/20 p-3 rounded border border-white/5">
                                    <strong className="text-white">Insight:</strong> Watch the "24h Change" metric. If it's red, your portfolio underperformed the market today.
                                </div>
                            </Card>
                        </div>
                    </section>

                    {/* Market Intelligence */}
                    <section id="market" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-400" /> Market Intelligence
                        </h2>
                        <div className="space-y-8">
                            <div className="prose prose-invert max-w-none">
                                <p className="text-lg text-muted-foreground">
                                    Data is only useful if you can interpret it. FinSight aggregates data from 50+ global exchanges to give you a single "Truth" price.
                                </p>
                            </div>

                            <div className="grid gap-6">
                                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                        <Search className="w-5 h-5 text-primary" /> The Global Search Bar
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        The search bar isn't just for navigation; it's a data tool.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
                                            <span><strong>Tickers:</strong> Type "BTC" or "AAPL" to jump to asset pages.</span>
                                        </li>
                                        <li className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
                                            <span><strong>Pair Discovery:</strong> Searching "USD" will show you all supported Forex pairs (EUR/USD, GBP/USD).</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                                    <h3 className="text-xl font-semibold mb-4">Understanding the Charts</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Our charts use "Candlestick" visualization for maximum information density.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <span className="font-bold text-green-400 block mb-1">Green Candle</span>
                                            Price closed <strong>higher</strong> than it opened (Bullish).
                                        </div>
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                            <span className="font-bold text-red-400 block mb-1">Red Candle</span>
                                            Price closed <strong>lower</strong> than it opened (Bearish).
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* AI Advisors */}
                    <section id="advisors" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <Brain className="w-8 h-8 text-pink-400" /> AI Advisors
                        </h2>
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-background to-white/[0.02] p-8">
                            <div className="relative z-10 space-y-8">
                                <p className="text-lg text-muted-foreground">
                                    Stop guessing. Our AI models are trained on 10 years of historical data to predict price movements. Here is how to use them effectively:
                                </p>

                                <div className="space-y-6">
                                    <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 font-bold text-blue-400">S</div>
                                        <div>
                                            <h4 className="font-bold text-lg">Stock Advisor</h4>
                                            <p className="text-sm text-muted-foreground">Best for: <strong>Long-term Investors</strong></p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Analyzes P/E ratios, earnings calls, and S&P 500 volatility. Use this if you want to build a retirement portfolio.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 font-bold text-yellow-400">C</div>
                                        <div>
                                            <h4 className="font-bold text-lg">Crypto Advisor</h4>
                                            <p className="text-sm text-muted-foreground">Best for: <strong>High-Risk Traders</strong></p>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Monitors on-chain volume, whale movements, and social sentiment (Twitter/Reddit). Use this for catching short-term pumps.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20 flex gap-4">
                                    <Zap className="w-5 h-5 text-pink-400 flex-shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-pink-400">Interpreting the "Confidence Score"</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Every AI prediction comes with a percentage (e.g., 85%).
                                            <br />
                                            <strong>Below 60%:</strong> Uncertain. High risk.
                                            <br />
                                            <strong>Above 80%:</strong> Strong Signal. Historical correlation is high.
                                        </p>
                                    </div>
                                </div>

                                <Button variant="outline" asChild className="w-full">
                                    <Link href="/choose-advisor">Start AI Consultation</Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* Trading Engine */}
                    <section id="trading" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-green-400" /> Trading Engine
                        </h2>
                        <div className="space-y-8">
                            <p className="text-lg text-muted-foreground">
                                This is where you execute your strategy. Our simulator mimics real-exchange conditions.
                            </p>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Market Order */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold border-b border-white/10 pb-2">Market Orders</h3>
                                    <p className="text-sm text-muted-foreground">
                                        An order to buy/sell <strong>immediately</strong> at the best available current price.
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span><strong>Speed:</strong> Instant execution.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            <span><strong>Risk:</strong> You might pay slightly more if the market is volatile (Slippage).</span>
                                        </li>
                                    </ul>
                                    <div className="bg-white/5 p-3 rounded text-xs font-mono">
                                        Action: Buy 1 BTC @ Market<br />
                                        Result: 1 BTC added to portfolio instantly.
                                    </div>
                                </div>

                                {/* Limit Order */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold border-b border-white/10 pb-2">Limit Orders</h3>
                                    <p className="text-sm text-muted-foreground">
                                        An order to buy/sell ONLY at a <strong>specific price</strong> (or better).
                                    </p>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            <span><strong>Control:</strong> You set the exact price you want to pay.</span>
                                        </li>
                                        <li className="flex gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            <span><strong>Risk:</strong> The order might never fill if the price doesn't hit your target.</span>
                                        </li>
                                    </ul>
                                    <div className="bg-white/5 p-3 rounded text-xs font-mono">
                                        Action: Buy 1 BTC @ $60,000<br />
                                        Result: Order waits in "Open Orders" until BTC hits $60k.
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <h4 className="font-bold text-orange-400 mb-2">How to Execute a Trade:</h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                                    <li>Navigate to any Asset Page (e.g., <Link href="/bitcoin" className="text-primary hover:underline">/bitcoin</Link>).</li>
                                    <li>Look for the <strong>"Trade"</strong> panel on the right side.</li>
                                    <li>Select <strong>Buy</strong> or <strong>Sell</strong> toggle.</li>
                                    <li>Enter the <strong>Amount</strong> (e.g., 0.5 BTC).</li>
                                    <li>Click <strong>Confirm Trade</strong>. The asset will instantly appear in your Portfolio.</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                    {/* Portfolio Management */}
                    <section id="portfolio" className="scroll-mt-32">
                        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                            <Wallet className="w-8 h-8 text-yellow-400" /> Portfolio Management
                        </h2>
                        <div className="grid gap-6">
                            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                                <h3 className="text-xl font-semibold mb-4">Unified Tracking</h3>
                                <p className="text-muted-foreground mb-4">
                                    We calculate your "Total Net Worth" by aggregating Crypto, Stocks, and Cash. This helps you understand your true financial health.
                                </p>
                                <div className="flex gap-4 flex-wrap">
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs">Crypto (Real-time)</span>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs">Stocks (15min delay)</span>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs">Forex (Real-time)</span>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                                <h3 className="text-xl font-semibold mb-2">Performance Metrics</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 border-b border-white/5">
                                        <span className="text-muted-foreground">Daily P&L</span>
                                        <span className="text-right text-sm">Profit or Loss in the last 24 hours. Vital for day traders.</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 border-b border-white/5">
                                        <span className="text-muted-foreground">Total Return</span>
                                        <span className="text-right text-sm">Overall gain/loss since you bought the asset. Vital for investors.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* CTA Footer */}
                    <section className="py-20 text-center border-t border-white/10 mt-12">
                        <h2 className="text-3xl font-bold mb-6">Ready to apply what you've learned?</h2>
                        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                            The best way to learn is by doing. Launch your dashboard now and place your first simulated trade.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button size="lg" asChild className="px-8 bg-primary hover:bg-primary/90">
                                <Link href="/dashboard">Go to Dashboard</Link>
                            </Button>
                            <Button size="lg" variant="outline" asChild>
                                <Link href="/contact">Contact Support</Link>
                            </Button>
                        </div>
                    </section>

                </div>
            </main>
        </div>
    );
}

