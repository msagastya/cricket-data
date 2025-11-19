// src/app/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="text-center">
      <header className="py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
          Welcome to CricketData
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-400">
          Your modern platform for cricket analytics.
        </p>
      </header>

      <div className="mt-8">
        {loading ? (
          <div className="h-10"></div> // Placeholder for loading state
        ) : user ? (
          <div className="space-y-4">
            <p className="text-cyan-400">You are logged in as {user.email}.</p>
            <div className="flex justify-center gap-4">
              <Link href="/matches" className="inline-block bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 transition-colors">
                Browse Matches
              </Link>
              <Link href="/admin/upload" className="inline-block bg-gray-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-600 transition-colors">
                Upload Data
              </Link>
            </div>
          </div>
        ) : (
          <Link href="/login" className="inline-block bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 transition-colors">
            Login to Get Started
          </Link>
        )}
      </div>
    </div>
  );
}