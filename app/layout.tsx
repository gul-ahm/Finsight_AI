import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/frontend/ui/toaster';
import { ThemeProvider } from '@/frontend/theme-provider';
import { ThemeToggle } from '@/frontend/theme-toggle';
import { ErrorBoundary } from '@/frontend/ErrorBoundary';
import { CommandPalette } from '@/frontend/CommandPalette';
import AuthContext from '@/frontend/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FinSight AI - Smart Market Intelligence',
  description: 'Real-time stock, forex and crypto markets analysis with AI-powered insights and community sentiment.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/favicon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/favicon.png',
      },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthContext>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="fixed bottom-4 left-4 z-50">
                <ThemeToggle />
              </div>
              {children}
              <Toaster />
              <CommandPalette />
            </ThemeProvider>
          </AuthContext>
        </ErrorBoundary>
      </body>
    </html>
  );
}
