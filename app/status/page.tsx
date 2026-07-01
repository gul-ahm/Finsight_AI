"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/ui/card';
import { Badge } from '@/frontend/ui/badge';
import { Button } from '@/frontend/ui/button';
import { Loader2, CheckCircle2, XCircle, RefreshCcw } from "lucide-react";

export default function StatusPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState<string | null>(null);

    const checkHealth = async () => {
        setLoading(true);
        try {
            // Validating Frontend -> Backend Connection
            const res = await fetch('/api/health');
            if (!res.ok) throw new Error('API Unreachable');
            const json = await res.json();
            setData(json);
            setLastChecked(new Date().toLocaleTimeString());
        } catch (error) {
            setData({ status: 'CRITICAL_FAILURE', checks: {} });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    const getStatusColor = (status: string) => {
        if (status === 'HEALTHY' || status === 'CONNECTED') return 'bg-green-500/10 text-green-500 border-green-500/20';
        if (status === 'PENDING') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        return "bg-red-500/10 text-red-500 border-red-500/20";
    };

    const getIcon = (status: string) => {
        if (status === 'HEALTHY' || status === 'CONNECTED') return <CheckCircle2 className="h-5 w-5" />;
        return <XCircle className="h-5 w-5" />;
    };

    return (
        <div className="min-h-screen bg-background p-8 flex items-center justify-center">
            <Card className="w-full max-w-2xl border-primary/20 bg-card/50 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                        System Connectivity Status
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={checkHealth} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </Button>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Main Status */}
                    <div className={`p-4 rounded-lg border flex items-center justify-between ${getStatusColor(data?.status || 'PENDING')}`}>
                        <span className="font-semibold text-lg">Overall System Health</span>
                        <div className="flex items-center space-x-2">
                            {data ? getIcon(data.status) : <Loader2 className="h-5 w-5 animate-spin" />}
                            <span className="font-bold">{data?.status || 'CHECKING...'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Frontend -> Backend */}
                        <Card className="bg-background/40">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Frontend → Backend API</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className={getStatusColor(data ? 'CONNECTED' : 'PENDING')}>
                                        {data ? 'CONNECTED (200 OK)' : 'CONNECTING...'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Verifies that the Next.js Client can talk to the Server API Route.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Backend -> Database */}
                        <Card className="bg-background/40">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Backend → MySQL Database</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className={getStatusColor(data?.checks?.database || 'PENDING')}>
                                        {data?.checks?.database || 'WAITING'}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Verifies Prisma Client can execute queries on the database.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Backend -> External APIs */}
                        <Card className="bg-background/40 col-span-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Backend → External Services</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Google Connectivity</span>
                                    <Badge variant="outline" className={getStatusColor(data?.checks?.google || 'PENDING')}>
                                        {data?.checks?.google || 'WAITING'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">NewsAPI Key Check</span>
                                    <Badge variant="outline" className={getStatusColor(data?.checks?.newsApi || 'PENDING')}>
                                        {data?.checks?.newsApi || 'WAITING'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">
                        Last Checked: {lastChecked || 'Never'} • Latency: {data?.latency || '...'}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}

