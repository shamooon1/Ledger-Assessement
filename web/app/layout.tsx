import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Equipment Ledger — Site Store Hatch',
  description: 'Physical equipment ledger and site store tracking system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 selection:bg-zinc-200">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 text-zinc-900 hover:opacity-80 transition-opacity">
                <span className="w-3.5 h-3.5 bg-zinc-900 rounded-sm inline-block"></span>
                <span className="font-semibold tracking-tight text-base uppercase">Equipment Ledger</span>
                <span className="text-[11px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded border border-zinc-200">
                  Store Hatch
                </span>
              </Link>

              <nav className="hidden sm:flex items-center gap-1">
                <Link
                  href="/"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                >
                  Store Overview
                </Link>
                <Link
                  href="/as-of"
                  className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors"
                >
                  Point-in-Time Query
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                API Connected
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="border-t border-zinc-200 bg-white py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-2 font-mono">
            <span>The Equipment Ledger · Single-Holder Invariant Guaranteed</span>
            <span>NestJS + MongoDB Replica Set + Next.js</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
