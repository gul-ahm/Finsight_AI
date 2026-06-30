"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/frontend/ui/button";
import {
  BarChart3,
  ArrowRight,
  Zap,
  Globe,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  Cpu,
  MessageSquare,
  Menu,
  X,
  Linkedin,
  Github
} from "lucide-react";
import Link from "next/link";
import { AuthStatus } from "@/frontend/AuthStatus";
import { useSession } from "next-auth/react";

// Mock Data for Infinite Ticker
const TICKER_ITEMS = [
  { symbol: "BTC", price: "$64,230", change: "+2.4%" },
  { symbol: "ETH", price: "$3,450", change: "+1.8%" },
  { symbol: "SOL", price: "$145.20", change: "+5.1%" },
  { symbol: "AAPL", price: "$178.35", change: "+0.5%" },
  { symbol: "NVDA", price: "$890.10", change: "+3.2%" },
  { symbol: "EUR/USD", price: "1.0845", change: "-0.1%" },
  { symbol: "TSLA", price: "$175.50", change: "-1.2%" },
  { symbol: "GOLD", price: "$2,350", change: "+0.8%" },
];

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const handleLaunchApp = () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else {
      router.push('/auth/signin');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary to-cyan-400 rounded-full blur opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
              <BarChart3 className="w-6 h-6 text-primary relative z-10" />
            </div>
            <span className="font-bold text-lg tracking-tight">FinSight<span className="text-primary">.AI</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#market" className="hover:text-foreground transition-colors">Market</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <AuthStatus />
            <Button onClick={handleLaunchApp} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              Launch App
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 px-6 md:hidden">
          <div className="flex flex-col gap-6 text-lg font-medium">
            <Link href="#features" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="#market" onClick={() => setMobileMenuOpen(false)}>Market</Link>
            <Link href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Button onClick={handleLaunchApp} className="w-full">Launch App</Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-8"
          >
            <Zap className="w-3 h-3" />
            <span>Next-Gen Market Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            Trade smarter with <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">AI-Powered Insights</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Navigate volatile markets with the power of artificial intelligence.
            Real-time analysis, crypto forecasts, and community sentiment—all in one dashboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" onClick={handleLaunchApp} className="w-full sm:w-auto px-8 h-12 text-base shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90">
              Start Trading Now <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Link href="/guide">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 text-base border-white/10 hover:bg-white/5">
                How it Works
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Infinite Ticker */}
      <div className="w-full border-y border-white/5 bg-white/[0.02] backdrop-blur-sm overflow-hidden py-3">
        <motion.div
          className="flex gap-12 whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-sm font-medium">
              <span className="text-muted-foreground">{item.symbol}</span>
              <span>{item.price}</span>
              <span className={item.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}>
                {item.change}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features Grid (Bento Style) */}
      <section id="features" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to win</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Replace guesswork with data. Our suite of tools gives you the edge institutional investors have had for decades.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">

            {/* Large Card: AI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-8 flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-12 opacity-20 group-hover:opacity-30 transition-opacity">
                <Cpu className="w-64 h-64 text-primary" />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">AI-Powered Forecasting</h3>
                <p className="text-muted-foreground max-w-md">Our proprietary algorithms analyze millions of data points to predict market trends with up to 87% accuracy.</p>
              </div>
              <Button variant="link" className="w-fit p-0 h-auto text-primary group-hover:translate-x-1 transition-transform">
                Explore AI Advisors <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>

            {/* Card: Crypto */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-8 flex flex-col justify-between"
            >
              <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <Globe className="w-32 h-32 text-cyan-400" />
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-6">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Global Coverage</h3>
                <p className="text-sm text-muted-foreground">Stocks, Forex, Crypto—monitor all your assets in one unified interface.</p>
              </div>
            </motion.div>

            {/* Card: Sentiment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-8 flex flex-col justify-between"
            >
              <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <MessageSquare className="w-32 h-32 text-purple-400" />
              </div>
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">Social Sentiment</h3>
                <p className="text-sm text-muted-foreground">Track Reddit & Twitter trends. Know what the community is saying before it hits the news.</p>
              </div>
            </motion.div>

            {/* Large Card: Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-8 flex flex-col justify-between"
            >
              <div className="absolute top-0 right-10 w-64 h-full bg-gradient-to-l from-background to-transparent z-10 md:block hidden"></div>
              {/* Mock Phone UI could go here as an image */}
              <div className="relative z-10 max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6 text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Trade on the Go</h3>
                <p className="text-muted-foreground">Responsive design ensures you never miss a beat, whether you're at your desk or on your phone. Real-time sync across all devices.</p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Market Section */}
      <section id="market" className="py-24 px-6 bg-white/[0.02] border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Real-Time Market Pulse</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay ahead of the curve with live data across global markets. Customize your dashboard to track what matters most.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Market Stat Cards */}
            {[
              { symbol: "BTC/USD", price: "$64,230", change: "+2.4%", trend: "up" },
              { symbol: "ETH/USD", price: "$3,450", change: "+1.8%", trend: "up" },
              { symbol: "EUR/USD", price: "1.0845", change: "-0.1%", trend: "down" },
              { symbol: "GOLD", price: "$2,350", change: "+0.8%", trend: "up" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-white/10 bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="font-bold text-lg">{item.symbol}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${item.trend === 'up' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {item.change}
                  </span>
                </div>
                <div className="text-2xl font-bold">{item.price}</div>
                <div className="text-xs text-muted-foreground mt-2">Real-time Data</div>
              </motion.div>
            ))}

            {/* Market Overview Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="md:col-span-2 lg:col-span-4 mt-6 p-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-cyan-500/20 rounded-3xl"
            >
              <div className="bg-background/90 backdrop-blur-xl rounded-[22px] p-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Deep Market Analysis</h3>
                    <p className="text-muted-foreground">Unlock institutional-grade charts and indicators. Identify support/resistance levels automatically with AI.</p>
                  </div>
                  <Link href="/choose-market">
                    <Button className="bg-white text-black hover:bg-white/90">
                      View Full Market Data
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your trading style. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col"
            >
              <div className="mb-6">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Starter</h3>
                <div className="text-4xl font-bold">Free</div>
                <div className="text-sm text-muted-foreground mt-1">Forever</div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Basic Market Data", "3 Daily AI Insights", "Standard Watchlist", "Community Access"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {feat}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={handleLaunchApp}>
                Get Started
              </Button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative p-8 rounded-3xl border border-primary/50 bg-primary/5 flex flex-col shadow-2xl shadow-primary/10"
            >
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 rounded-full bg-primary text-white text-xs font-bold">POPULAR</span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-primary mb-2">Pro Trader</h3>
                <div className="text-4xl font-bold">$29<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                <div className="text-sm text-muted-foreground mt-1">Billed monthly</div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["Real-time Global Data", "Unlimited AI Forecasts", "Advanced Portfolio Analytics", "Priority Support", "Sentiment Analysis"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {feat}
                  </li>
                ))}
              </ul>
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleLaunchApp}>
                Start Free Trial
              </Button>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col"
            >
              <div className="mb-6">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Enterprise</h3>
                <div className="text-4xl font-bold">Custom</div>
                <div className="text-sm text-muted-foreground mt-1">Contact for pricing</div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {["API Access", "Dedicated Account Manager", "Custom Integrations", "SLA Guarantee", "White-label Options"].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <ShieldCheck className="w-4 h-4 text-primary" /> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="w-full">
                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                  Contact Sales
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to upgrade your strategy?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of traders who are already using FinSight AI to outperform the market.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleLaunchApp} className="w-full sm:w-auto px-10 h-14 text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
              Get Started for Free
            </Button>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 text-lg border-white/10 hover:bg-white/5">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">FinSight.AI</span>
            </Link>
            <div className="flex gap-4 mb-4">
              <Link href="https://www.linkedin.com/in/gul-ahm/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link href="https://github.com/gul-ahm" className="text-muted-foreground hover:text-primary">
                <Github className="h-5 w-5" />
              </Link>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Empowering retail investors with institutional-grade AI tools and data analytics.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link href="/stocks" className="hover:text-primary transition-colors">Stocks</Link></li>
              <li><Link href="/crypto" className="hover:text-primary transition-colors">Crypto</Link></li>
              <li><Link href="/forexs" className="hover:text-primary transition-colors">Forex</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} FinSight AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
