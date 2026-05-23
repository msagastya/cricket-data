import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Navigation from '@/app/components/Navigation';

export const metadata: Metadata = {
  title: 'Cricket Analysis Platform',
  description: 'Professional cricket analysis platform transforming Cricsheet data into insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navigation />

        <main>{children}</main>

        <footer className="bg-slate-900 text-slate-400 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-sm">
                Data provided by{' '}
                <a
                  href="https://cricsheet.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Cricsheet
                </a>
              </p>
              <p className="text-xs mt-2">
                Cricket Analysis Platform • Built with Next.js and Firebase
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
