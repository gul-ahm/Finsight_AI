import { Sidebar } from '@/frontend/layout/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar is fixed on desktop */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 md:ml-64 transition-all duration-300 ease-in-out">
                <div className="p-4 md:p-8 pt-16 md:pt-8 min-h-screen">
                    {/* 
                We can add a top bar here if needed, 
                but for now we'll keep it clean as per the radical redesign 
            */}
                    {children}
                </div>
            </main>
        </div>
    );
}

