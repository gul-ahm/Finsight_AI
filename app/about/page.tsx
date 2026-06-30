"use client";

import { motion } from "framer-motion";
import { Card } from '@/frontend/ui/card';
import { Button } from "@/frontend/ui/button";
import { BarChart3, Brain, MessageSquare, Zap, Globe, TrendingUp, Users, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const features = [
    {
      icon: BarChart3,
      title: "Real-Time Market Data",
      description: "Access live data from global exchanges for stocks, forex, and crypto markets with毫秒级 updates."
    },
    {
      icon: Brain,
      title: "AI-Powered Insights",
      description: "Advanced machine learning algorithms analyze market trends and provide actionable investment recommendations."
    },
    {
      icon: MessageSquare,
      title: "Community Sentiment",
      description: "Harness the power of social media and financial forums to gauge market sentiment in real-time."
    },
    {
      icon: Zap,
      title: "Instant Alerts",
      description: "Receive timely notifications on market-moving events, technical breakouts, and sentiment shifts."
    },
    {
      icon: Globe,
      title: "Global Coverage",
      description: "Comprehensive data on 8000+ stocks, 400+ forex pairs, and 1000+ cryptocurrencies worldwide."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-level security with end-to-end encryption and 99.9% uptime guarantee."
    }
  ];

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
              <Link href="/choose-market">
                <Button variant="ghost" className="hover:bg-primary/10">Markets</Button>
              </Link>
              <Link href="/choose-advisor">
                <Button variant="ghost" className="hover:bg-primary/10">Advisors</Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="hover:bg-primary/10">Contact</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-primary/20 hover:bg-primary/10">Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <section className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-teal-400">About FinSight AI</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Revolutionizing financial analysis with artificial intelligence and community intelligence
            </p>
          </motion.div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                At FinSight AI, we believe that everyone deserves access to professional-grade financial analysis tools.
                Our mission is to democratize financial intelligence by combining cutting-edge AI technology with
                community-driven insights to help investors make smarter decisions.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                We're building the most comprehensive financial analysis platform that seamlessly integrates
                real-time market data, technical indicators, social sentiment, and AI-powered insights into
                a single, intuitive interface.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/choose-advisor">Try Our AI Advisors</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/choose-market">Explore Markets</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-xl"></div>
              <Card className="relative p-8 bg-card/80 backdrop-blur-sm border border-primary/10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">10K+</div>
                    <div className="text-muted-foreground">Active Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">99.9%</div>
                    <div className="text-muted-foreground">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">500M+</div>
                    <div className="text-muted-foreground">Data Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">24/7</div>
                    <div className="text-muted-foreground">Support</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need for comprehensive financial analysis in one platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-primary/10 mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Creator Section */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Creator</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Passionate developer building the future of financial analysis
            </p>
          </motion.div>

          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <Card className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-muted rounded-full w-32 h-32 flex items-center justify-center overflow-hidden border-4 border-primary/10">
                    <img
                      src="https://github.com/gul-ahm.png"
                      alt="Ahmed Gulzar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">Ahmed Gulzar</h3>
                <p className="text-primary mb-4 font-medium">Data Scientist | No-Code/Low-Code Expert | Developer & Analytics</p>
                <div className="text-muted-foreground text-left max-w-2xl mx-auto space-y-4">
                  <p>
                    I am Ahmed Gulzar, a visionary Data Scientist and No-Code/Low-Code Expert with a passion for building scalable solutions. With deep expertise in developer tools and analytics, I bridge the gap between complex data and actionable insights, enabling rapid deployment of intelligent applications.
                  </p>
                  <p>
                    I specialize in leveraging advanced analytics and low-code platforms to accelerate digital transformation. My holistic approach combines technical depth in development with strategic foresight in data science, allowing me to create intuitive, data-driven ecosystems that empower users.
                  </p>
                  <p>
                    Committed to excellence in both code and strategy, I constantly explore the frontiers of "No-Code" efficiency and "Deep-Code" power, striving to deliver innovative solutions that redefine the future of financial technology.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Investment Strategy?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of investors who are already leveraging AI-powered insights and community intelligence
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/choose-advisor">Try AI Advisors Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/choose-market">Explore Markets</Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
