import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getRealTimePrice } from '@/backend/price-service'; // We will assume this is client-side safe or proxy it
// Note: getRealTimePrice is better used in an API route to hide API keys if we had them, 
// but for CoinGecko public API and synthetic data, client-side is fine for this demo.

export interface Holding {
    id: string;
    symbol: string;
    assetType: 'crypto' | 'stock' | 'forex';
    quantity: number;
    purchasePrice: number;
    currentPrice?: number;
    value?: number;
    change24h?: number;
}

export interface Portfolio {
    id: string;
    name: string;
    description?: string;
    holdings: Holding[];
    totalValue?: number;
    totalChange?: number; // Daily P&L
    createdAt?: string | Date;
    updatedAt?: string | Date; // Optional as it might be missing in some mocks
}

export function usePortfolio() {
    const { session, isAuthenticated } = useAuth();
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalBalance, setTotalBalance] = useState(0);
    const [dailyChange, setDailyChange] = useState({ value: 0, percentage: 0 });

    useEffect(() => {
        if (isAuthenticated && session?.user) {
            fetchPortfolios();
        } else {
            setIsLoading(false);
        }
    }, [isAuthenticated, session]);

    const fetchPortfolios = async () => {
        try {
            const res = await fetch('/api/portfolio');
            if (!res.ok) throw new Error('Failed to fetch portfolios');

            const data: Portfolio[] = await res.json();

            // Enrich with Real-Time Prices
            const enrichedPortfolios = await Promise.all(data.map(async (portfolio) => {
                let pValue = 0;
                let pChange = 0; // Weighted change

                const enrichedHoldings = await Promise.all(portfolio.holdings.map(async (holding) => {
                    const priceData = await getRealTimePrice(holding.symbol, holding.assetType);
                    const currentValue = priceData.price * holding.quantity;
                    const changeValue = currentValue * (priceData.change24h / 100);

                    pValue += currentValue;
                    pChange += changeValue;

                    return {
                        ...holding,
                        currentPrice: priceData.price,
                        change24h: priceData.change24h,
                        value: currentValue
                    };
                }));

                return {
                    ...portfolio,
                    holdings: enrichedHoldings,
                    totalValue: pValue,
                    totalChange: pChange
                };
            }));

            setPortfolios(enrichedPortfolios);

            // Calculate Grand Totals
            const grandTotal = enrichedPortfolios.reduce((acc, p) => acc + (p.totalValue || 0), 0);
            const totalChangeValue = enrichedPortfolios.reduce((acc, p) => acc + (p.totalChange || 0), 0);
            const totalChangePercent = grandTotal > 0 ? (totalChangeValue / grandTotal) * 100 : 0;

            setTotalBalance(grandTotal);
            setDailyChange({
                value: totalChangeValue,
                percentage: totalChangePercent
            });

        } catch (error) {
            console.error('Error fetching/calculating portfolio:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        portfolios,
        totalBalance,
        dailyChange,
        isLoading,
        refresh: fetchPortfolios
    };
}

