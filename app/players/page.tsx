'use client';

/**
 * Players Page
 *
 * Browse and analyze player statistics across all matches
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Loader2, AlertCircle, Search } from 'lucide-react';

interface PlayerBattingStats {
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highest_score: number;
  dismissals: number;
  fifties: number;
  hundreds: number;
  ducks: number;
  average: number;
  strike_rate: number;
}

interface PlayerBowlingStats {
  innings: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  dots: number;
  wides: number;
  noballs: number;
  best_figures: { wickets: number; runs: number };
  four_wickets: number;
  five_wickets: number;
  average: number;
  economy: number;
  strike_rate: number;
}

interface Player {
  player: string;
  teams: string[];
  matches: number;
  batting: PlayerBattingStats;
  bowling: PlayerBowlingStats;
}

type SortField = 'runs' | 'average' | 'strike_rate' | 'wickets' | 'economy' | 'bowling_average';
type FilterType = 'all' | 'batters' | 'bowlers' | 'all-rounders';

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('runs');
  const [filterType, setFilterType] = useState<FilterType>('all');

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [players, searchQuery, sortField, filterType]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/players');

      if (!response.ok) {
        throw new Error('Failed to fetch players');
      }

      const data = await response.json();
      setPlayers(data.players || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...players];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.player.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.teams.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply role filter
    if (filterType === 'batters') {
      filtered = filtered.filter(p => p.batting.runs >= 100 && p.batting.runs > p.bowling.wickets * 20);
    } else if (filterType === 'bowlers') {
      filtered = filtered.filter(p => p.bowling.wickets >= 5 && p.bowling.wickets * 20 > p.batting.runs);
    } else if (filterType === 'all-rounders') {
      filtered = filtered.filter(p => p.batting.runs >= 100 && p.bowling.wickets >= 5);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortField) {
        case 'runs':
          return b.batting.runs - a.batting.runs;
        case 'average':
          return b.batting.average - a.batting.average;
        case 'strike_rate':
          return b.batting.strike_rate - a.batting.strike_rate;
        case 'wickets':
          return b.bowling.wickets - a.bowling.wickets;
        case 'economy':
          return a.bowling.economy - b.bowling.economy; // Lower is better
        case 'bowling_average':
          return a.bowling.average - b.bowling.average; // Lower is better
        default:
          return 0;
      }
    });

    setFilteredPlayers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading player statistics...</p>
          <p className="text-sm text-slate-500 mt-2">Aggregating player data</p>
          <p className="text-xs text-slate-400 mt-3">First load may take a few seconds. Subsequent loads will be instant.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchPlayers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Players</h1>
          <p className="text-slate-600">
            {filteredPlayers.length} {filteredPlayers.length === 1 ? 'player' : 'players'}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search players or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Players</option>
            <option value="batters">Batters</option>
            <option value="bowlers">Bowlers</option>
            <option value="all-rounders">All-Rounders</option>
          </select>

          {/* Sort */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <optgroup label="Batting">
              <option value="runs">Most Runs</option>
              <option value="average">Best Average</option>
              <option value="strike_rate">Best Strike Rate</option>
            </optgroup>
            <optgroup label="Bowling">
              <option value="wickets">Most Wickets</option>
              <option value="economy">Best Economy</option>
              <option value="bowling_average">Best Bowling Average</option>
            </optgroup>
          </select>
        </div>

        {/* Players Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Rank</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Player</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">Teams</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700">Matches</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-blue-50">Runs</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-blue-50">Avg</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-blue-50">SR</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-blue-50">100s/50s</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-green-50">Wkts</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-green-50">Avg</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-green-50">Econ</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 bg-green-50">5W</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPlayers.map((player, index) => (
                  <tr
                    key={player.player}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-slate-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/players/${encodeURIComponent(player.player)}`}
                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {player.player}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600 truncate max-w-xs">
                        {player.teams.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700">
                      {player.matches}
                    </td>

                    {/* Batting Stats */}
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900 bg-blue-50">
                      {player.batting.runs}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700 bg-blue-50">
                      {player.batting.average > 0 ? player.batting.average.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700 bg-blue-50">
                      {player.batting.strike_rate > 0 ? player.batting.strike_rate.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700 bg-blue-50">
                      {player.batting.hundreds}/{player.batting.fifties}
                    </td>

                    {/* Bowling Stats */}
                    <td className="px-6 py-4 text-center text-sm font-semibold text-slate-900 bg-green-50">
                      {player.bowling.wickets}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700 bg-green-50">
                      {player.bowling.wickets > 0 ? player.bowling.average.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700 bg-green-50">
                      {player.bowling.balls > 0 ? player.bowling.economy.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-700 bg-green-50">
                      {player.bowling.five_wickets}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredPlayers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Players Found</h3>
            <p className="text-slate-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-8 text-center text-slate-600">
          <p>Total {players.length} players • {filteredPlayers.length} displayed</p>
        </div>
      </div>
    </div>
  );
}
