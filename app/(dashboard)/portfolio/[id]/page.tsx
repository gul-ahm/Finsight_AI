"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  DollarSign,
  ArrowLeft,
  Plus,
  Loader2,
  TrendingUp,
  TrendingDown,
  Percent,
  Trash2,
} from "lucide-react";
import { Button } from '@/frontend/ui/button';
import { Card } from '@/frontend/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/frontend/ui/dialog';
import { Input } from '@/frontend/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/frontend/ui/table';
import { useToast } from '@/frontend/hooks/use-toast';
import { SymbolSearch } from '@/frontend/SymbolSearch';
import { ExportButton } from '@/frontend/ExportButton';
import { usePortfolio } from '@/frontend/hooks/usePortfolio';

export default function PortfolioDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const { portfolios, isLoading, refresh } = usePortfolio();

  // Find the specific portfolio from the global state
  const portfolio = useMemo(() =>
    portfolios.find(p => p.id === params.id),
    [portfolios, params.id]
  );

  const [adding, setAdding] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form states
  const [symbol, setSymbol] = useState("");
  const [assetType, setAssetType] = useState("stock");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [notes, setNotes] = useState("");


  const addHolding = async () => {
    if (!symbol || !quantity || !purchasePrice) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setAdding(true);
    try {
      const response = await fetch(`/api/portfolios/${params.id}/holdings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          assetType,
          quantity: parseFloat(quantity),
          purchasePrice: parseFloat(purchasePrice),
          notes,
          purchaseDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to add holding");

      await refresh();
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Holding added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add holding",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const deleteHolding = async (index: number) => {
    // Note: Ideally use holding ID. Fallback to index if needed but preferably holding.id
    if (!portfolio || !portfolio.holdings[index]) return;
    const holding = portfolio.holdings[index];
    // Ideally holding has an ID. The hook defines Holding interface with ID.
    // If holding.id is missing (e.g. legacy data), we might have issues.
    // Assuming holding.id exists as per interface.

    const holdingId = holding.id;
    if (!holdingId) {
      // Fallback or error
      toast({ title: "Error", description: "Holding ID missing, cannot delete." });
      return;
    }

    try {
      const response = await fetch(`/api/portfolios/${params.id}/holdings?holdingId=${holdingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refresh();
        toast({ title: "Success", description: "Holding removed" });
      } else {
        toast({ title: "Error", description: "Failed to delete holding." });
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete holding",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSymbol("");
    setQuantity("");
    setPurchasePrice("");
    setNotes("");
    setAssetType("stock");
  };

  const { totalValue, totalCost, totalPL, totalPLPercent } = useMemo(() => {
    if (!portfolio?.holdings) return { totalValue: 0, totalCost: 0, totalPL: 0, totalPLPercent: 0 };

    // totalValue is already calculated by the hook!
    const value = (portfolio as any).totalValue || 0;

    // Calculate cost manually as hook might not provide totalCost explicitly
    let cost = 0;
    portfolio.holdings.forEach((h) => {
      cost += h.quantity * h.purchasePrice;
    });

    const pl = value - cost;
    const plPercent = cost > 0 ? (pl / cost) * 100 : 0;

    return { totalValue: value, totalCost: cost, totalPL: pl, totalPLPercent: plPercent };
  }, [portfolio]);

  const exportPortfolioToCSV = (portfolio: any, holdings: any) => {
    console.log("Export CSV");
  };

  const exportPortfolioToPDF = (portfolio: any, holdings: any) => {
    console.log("Export PDF");
  };


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-xl">Portfolio not found</p>
        <Button onClick={() => router.push('/portfolio')}>Back to Portfolios</Button>
      </div>
    )
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
        {/* User Info Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 backdrop-blur-sm border rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-12 h-12 rounded-full border-2 border-primary/20"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold">{session?.user?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/portfolio")}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              All Portfolios
            </Button>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold">{portfolio.name}</h1>
              {portfolio.description && (
                <p className="text-muted-foreground mt-2">
                  {portfolio.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Created {new Date(portfolio.createdAt || new Date()).toLocaleDateString()} •
                Last updated {new Date(portfolio.updatedAt || new Date()).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push(`/portfolio/${params.id}/analytics`)}
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </Button>
              <ExportButton
                onExportCSV={async () => { exportPortfolioToCSV(portfolio, portfolio.holdings); return true; }}
                onExportPDF={async () => { exportPortfolioToPDF(portfolio, portfolio.holdings); return true; }}
              />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2">
                    <Plus className="w-5 h-5" />
                    Add Holding
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Holding</DialogTitle>
                    <DialogDescription>
                      Add a new asset to your portfolio
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Search Symbol
                      </label>
                      <SymbolSearch
                        value={symbol}
                        onChange={setSymbol}
                        onSelect={(asset) => {
                          setSymbol(asset.symbol);
                          setAssetType(asset.type);
                        }}
                        placeholder="Search for stocks, crypto..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Start typing to search for assets
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Asset Type</label>
                        <select
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                          value={assetType}
                          onChange={(e) => setAssetType(e.target.value)}
                        >
                          <option value="stock">Stock</option>
                          <option value="crypto">Crypto</option>
                          <option value="forex">Forex</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Symbol</label>
                        <Input
                          value={symbol}
                          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                          placeholder="Or type manually"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <Input
                          type="number"
                          placeholder="10"
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Purchase Price
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="150.50"
                          value={purchasePrice}
                          onChange={(e) => setPurchasePrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Notes (Optional)
                      </label>
                      <Input
                        placeholder="Add notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={addHolding} disabled={adding}>
                      {adding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Holding"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${totalValue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">
                  ${totalCost.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${totalPL >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {totalPL >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-500" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${Math.abs(totalPL).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${totalPLPercent >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                <Percent className={`w-6 h-6 ${totalPLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Return %</p>
                <p className={`text-2xl font-bold ${totalPLPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalPLPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">Holdings</h2>
          {portfolio.holdings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No holdings yet. Add your first holding to get started.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Holding
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Purchase Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolio.holdings.map((holding: any, index: number) => {
                  const currentPrice = holding.currentPrice || holding.purchasePrice;
                  const currentValue = currentPrice * holding.quantity;
                  const pl = currentValue - (holding.quantity * holding.purchasePrice);
                  const plPercent = (holding.quantity * holding.purchasePrice) > 0
                    ? (pl / (holding.quantity * holding.purchasePrice)) * 100
                    : 0;

                  return (
                    <TableRow key={index}>
                      <TableCell className="font-bold">{holding.symbol}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-muted rounded text-xs">
                          {holding.assetType}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{holding.quantity}</TableCell>
                      <TableCell className="text-right">
                        ${holding.purchasePrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(currentPrice || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${(currentValue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right ${pl >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {plPercent.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        {new Date(holding.purchaseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHolding(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
