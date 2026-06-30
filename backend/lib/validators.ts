import { z } from 'zod';

export const SignUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters")
        .regex(/^(?=.*[A-Za-z])(?=.*[\d@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must contain at least one letter and one number or special character")
});

export const PortfolioSchema = z.object({
    name: z.string().min(1, "Portfolio name is required"),
    description: z.string().optional()
});

export const WatchlistSchema = z.object({
    name: z.string().min(1, "Watchlist name is required"),
    // Optionally used when just creating a watchlist
});

export const WatchlistAssetSchema = z.object({
    symbol: z.string().min(1, "Symbol is required"),
});

export const ProfileSchema = z.object({
    name: z.string().min(2).optional(),
    isPublic: z.boolean().optional()
});

