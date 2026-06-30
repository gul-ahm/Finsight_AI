import { z } from 'zod';

export const SignUpSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
    email: z.string().email("Invalid email address").max(100, "Email cannot exceed 100 characters"),
    password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password cannot exceed 128 characters")
        .regex(/^(?=.*[A-Za-z])(?=.*[\d@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, "Password must contain at least one letter and one number or special character")
});

export const PortfolioSchema = z.object({
    name: z.string().min(1, "Portfolio name is required").max(60, "Portfolio name cannot exceed 60 characters"),
    description: z.string().max(500, "Description cannot exceed 500 characters").optional()
});

export const WatchlistSchema = z.object({
    name: z.string().min(1, "Watchlist name is required").max(60, "Watchlist name cannot exceed 60 characters"),
    // Optionally used when just creating a watchlist
});

export const WatchlistAssetSchema = z.object({
    symbol: z.string().min(1, "Symbol is required").max(20, "Symbol cannot exceed 20 characters"),
});

export const ProfileSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    isPublic: z.boolean().optional()
});

