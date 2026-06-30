"use client";

import { useState, useEffect } from "react";
import { usePortfolio } from "@/frontend/hooks/usePortfolio"; // Added import
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from '@/frontend/ui/card';
import { Button } from '@/frontend/ui/button';
import { Input } from '@/frontend/ui/input';
import { Textarea } from '@/frontend/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/frontend/ui/dialog";
import { useToast } from "@/frontend/hooks/use-toast";
import Link from "next/link";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  Loader2,
  ArrowRight,
  Home,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

interface Portfolio {
  id: string; // Updated to match Prisma
  name: string;
  description?: string;
  holdings: Array<{
    symbol: string;
    assetType: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const { portfolios, isLoading: loading, refresh } = usePortfolio(); // Use the hook!
  const [creating, setCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // New portfolio form
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Existing fetchPortfolios removed as hook handles it

  const createPortfolio = async () => {
    if (!newPortfolioName.trim()) {
      toast({
        title: "Error",
        description: "Portfolio name is required",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/finsight-ai/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPortfolioName,
          description: newPortfolioDesc,
        }),
      });

      if (res.ok) {
        await res.json();
        refresh();
        setIsDialogOpen(false);
        setNewPortfolioName("");
        setNewPortfolioDesc("");
        toast({
          title: "Success",
          description: "Portfolio created successfully",
        });
      } else {
        const error = await res.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create portfolio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating portfolio:", error);
      toast({
        title: "Error",
        description: "Failed to create portfolio",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };



  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
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

      <div className="max-w-7xl mx-auto space-y-8 p-6 relative z-10">
        {/* User Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm border rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-16 h-16 rounded-full border-2 border-primary/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{session?.user?.name}</h2>
                <p className="text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                Home
              </Button>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Portfolios</p>
                <p className="text-3xl font-bold text-primary">{portfolios.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Statistics */}
        {portfolios.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${portfolios
                      .reduce((sum, p) => sum + ((p as any).totalValue || 0), 0)
                      .toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Holdings</p>
                  <p className="text-2xl font-bold">
                    {portfolios.reduce((sum, p) => sum + p.holdings.length, 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Portfolios</p>
                  <p className="text-2xl font-bold">
                    {portfolios.filter((p) => p.holdings.length > 0).length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Portfolio</p>
                  <p className="text-2xl font-bold">
                    $
                    {portfolios.length > 0
                      ? (
                        portfolios.reduce(
                          (sum, p) => sum + ((p as any).totalValue || 0),
                          0
                        ) / portfolios.length
                      ).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                      : "0.00"}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              My Portfolios
            </h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your investment portfolios
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Create Portfolio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Portfolio</DialogTitle>
                <DialogDescription>
                  Create a new portfolio to track your investments
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Portfolio Name</label>
                  <Input
                    placeholder="e.g., Tech Stocks, Crypto Holdings"
                    value={newPortfolioName}
                    onChange={(e) => setNewPortfolioName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    placeholder="Describe your investment strategy..."
                    value={newPortfolioDesc}
                    onChange={(e) => setNewPortfolioDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createPortfolio} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Portfolio"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Portfolios Grid */}
        {portfolios.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No Portfolios Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first portfolio to start tracking your investments
            </p>
            <Button onClick={() => setIsDialogOpen(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Portfolio
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolios.map((portfolio, index) => {
              const totalValue = (portfolio as any).totalValue || 0;
              const holdingsCount = portfolio.holdings.length;

              return (
                <motion.div
                  key={portfolio.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="p-6 hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/50"
                    onClick={() => router.push(`/portfolio/${portfolio.id}`)}
                  >
                    <div className="space-y-4">
                      {/* Portfolio Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {portfolio.name}
                          </h3>
                          {portfolio.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {portfolio.description}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>

                      {/* Portfolio Stats */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">
                              Total Value
                            </span>
                          </div>
                          <span className="font-bold text-lg">
                            ${totalValue.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-muted-foreground">
                              Holdings
                            </span>
                          </div>
                          <span className="font-semibold">{holdingsCount}</span>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Created{" "}
                        {new Date((portfolio as any).createdAt || new Date()).toLocaleDateString()}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

