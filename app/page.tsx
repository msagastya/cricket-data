import Link from 'next/link';
import { Upload, TrendingUp, Users, MapPin, BarChart3, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Cricket Analysis Platform
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Transform Cricsheet ball-by-ball data into meaningful insights.
            Analyze cricket statistics from ANY perspective imaginable.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/admin/upload"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Upload size={20} />
              Upload Data
            </Link>
            <Link
              href="/matches"
              className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              Browse Matches
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Powerful Analytics Features
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Multi-Dimensional Analysis
            </h3>
            <p className="text-slate-600">
              Query across 8 core dimensions: Time, Players, Teams, Venues, Format, Phase, Context, and Competition.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-green-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Player Profiles
            </h3>
            <p className="text-slate-600">
              Comprehensive player statistics with batting, bowling, and fielding analytics across all formats.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="text-purple-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Venue Insights
            </h3>
            <p className="text-slate-600">
              Ground characteristics, pitch behavior, chase success rates, and historical trends at every venue.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="text-amber-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Advanced Visualizations
            </h3>
            <p className="text-slate-600">
              Cricket-specific charts: wagon wheels, manhattan charts, pitch maps, worm charts, and more.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-red-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Auto-Generated Insights
            </h3>
            <p className="text-slate-600">
              Discover records, trends, anomalies, correlations, and predictions automatically.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="text-cyan-600" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Matchup Analysis
            </h3>
            <p className="text-slate-600">
              Head-to-head battles: batter vs bowler, team vs team, with historical context and dominance indicators.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">50K+</div>
              <div className="text-slate-400">Matches Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">30K+</div>
              <div className="text-slate-400">Players Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">10M+</div>
              <div className="text-slate-400">Ball-by-Ball Records</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-amber-400 mb-2">500+</div>
              <div className="text-slate-400">Venues Analyzed</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Analyzing?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Upload your first Cricsheet file and unlock powerful cricket insights
          </p>
          <Link
            href="/admin/upload"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            <Upload size={20} />
            Upload Cricket Data
          </Link>
        </div>
      </div>

      {/* Data Source */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200">
        <div className="text-center text-slate-600">
          <p className="mb-2">
            Powered by{' '}
            <a
              href="https://cricsheet.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Cricsheet
            </a>
            {' '}– the free, open-source cricket data repository
          </p>
          <p className="text-sm text-slate-500">
            Download data from{' '}
            <a
              href="https://cricsheet.org/downloads/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
            >
              cricsheet.org/downloads
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
