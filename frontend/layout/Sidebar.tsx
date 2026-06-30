"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/backend/utils";
import {
    LayoutDashboard,
    LineChart,
    Wallet,
    Newspaper,
    Bot,
    Settings,
    LogOut,
    Menu,
    X,
    PieChart,
    Globe,
    Bitcoin,
    BarChart3,
    MessageSquare
} from "lucide-react";
import { Button } from "@/frontend/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Portfolio", href: "/portfolio", icon: PieChart },
    { name: "Watchlist", href: "/watchlist", icon: Wallet },
    { name: "Stocks", href: "/stocks", icon: LineChart },
    { name: "Forex", href: "/forexs", icon: Globe },
    { name: "Crypto", href: "/cryptos", icon: Bitcoin },
    { name: "Sentiment", href: "/reddit", icon: MessageSquare },
    { name: "News", href: "/news", icon: Newspaper },
    { name: "Advisors", href: "/choose-advisor", icon: Bot },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-background/80 backdrop-blur-md border-primary/20"
                >
                    {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Sidebar Container */}
            <AnimatePresence>
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-40 w-64 bg-background/95 backdrop-blur-xl border-r border-border/50 transform transition-transform duration-300 ease-in-out md:translate-x-0",
                        isOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="flex flex-col h-full">
                        {/* Logo */}
                        <div className="p-6 border-b border-border/50">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-primary/10">
                                    <BarChart3 className="w-6 h-6 text-primary" />
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                                    FinSight AI
                                </span>
                            </Link>
                        </div>

                        {/* Navigation */}
                        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                            {sidebarItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                                isActive
                                                    ? "text-primary bg-primary/10"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeNav"
                                                    className="absolute inset-0 bg-primary/10 border-l-2 border-primary"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                            <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-foreground")} />
                                            <span className="relative z-10">{item.name}</span>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Footer / User */}
                        <div className="p-4 border-t border-border/50">
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">US</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">User</p>
                                    <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </AnimatePresence>
        </>
    );
}

