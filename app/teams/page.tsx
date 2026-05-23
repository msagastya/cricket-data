'use client';

/**
 * Teams Page
 * Team analytics and statistics
 */

import Link from 'next/link';
import { Shield, Trophy, TrendingUp } from 'lucide-react';

export default function TeamsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Teams</h1>
          <p className="text-slate-600">Team analytics and performance insights</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <Shield className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Team Statistics Available Soon
              </h3>
              <p className="text-slate-700 mb-4">
                Team-level analytics including win/loss records, batting/bowling performance, and head-to-head comparisons will be available in the next update.
              </p>
              <p className="text-sm text-slate-600">
                In the meantime, explore individual player statistics and match details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/players"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <Trophy className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Players</h3>
            <p className="text-sm text-slate-600">
              View comprehensive player statistics including batting and bowling records
            </p>
          </Link>

          <Link
            href="/matches"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <Trophy className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Matches</h3>
            <p className="text-sm text-slate-600">
              Browse all 265 World Cup matches with detailed scorecards
            </p>
          </Link>

          <Link
            href="/leaderboards"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <TrendingUp className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Leaderboards</h3>
            <p className="text-sm text-slate-600">
              Explore top performers across different statistical categories
            </p>
          </Link>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">Planned Features</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Win/Loss Records</h4>
                <p className="text-sm text-slate-600">Complete team performance history with win percentages</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Head-to-Head Analysis</h4>
                <p className="text-sm text-slate-600">Team vs team historical matchup statistics</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Batting/Bowling Averages</h4>
                <p className="text-sm text-slate-600">Team-level aggregated performance metrics</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">Squad Analysis</h4>
                <p className="text-sm text-slate-600">Key players and squad composition insights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
