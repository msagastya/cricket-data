'use client';

/**
 * Leaderboards Page
 * Rankings and statistics leaders across all matches
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Target, TrendingUp, Loader2, AlertCircle } from 'lucide-react';

interface Player {
  player: string;
  teams: string[];
  batting: {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    average: number;
    strike_rate: number;
    hundreds: number;
    fifties: number;
    highest_score: number;
    dismissals: number;
    innings: number;
  };
  bowling: {
    wickets: number;
    balls: number;
    runs: number;
    average: number;
    economy: number;
    strike_rate: number;
    five_wickets: number;
    four_wickets: number;
    maidens: number;
    innings: number;
  };
}

type LeaderboardType = 'runs' | 'wickets' | 'batting_avg' | 'strike_rate' | 'economy';
type FormatType = 'all' | 'test' | 'odi' | 't20i' | 'ipl';

export default function LeaderboardsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<LeaderboardType>('runs');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('all');

  useEffect(() => {
    fetchPlayers();
  }, [selectedFormat]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const url = selectedFormat === 'all'
        ? '/api/players'
        : `/api/players?format=${selectedFormat}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      setPlayers(data.players || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboard = () => {
    let filtered = [...players];

    switch (selectedBoard) {
      case 'runs':
        return filtered.filter(p => p.batting.runs >= 100).sort((a, b) => b.batting.runs - a.batting.runs).slice(0, 20);
      case 'wickets':
        return filtered.filter(p => p.bowling.wickets >= 5).sort((a, b) => b.bowling.wickets - a.bowling.wickets).slice(0, 20);
      case 'batting_avg':
        return filtered.filter(p => p.batting.runs >= 200).sort((a, b) => b.batting.average - a.batting.average).slice(0, 20);
      case 'strike_rate':
        return filtered.filter(p => p.batting.runs >= 200).sort((a, b) => b.batting.strike_rate - a.batting.strike_rate).slice(0, 20);
      case 'economy':
        return filtered.filter(p => p.bowling.wickets >= 10).sort((a, b) => a.bowling.economy - b.bowling.economy).slice(0, 20);
      default:
        return [];
    }
  };

  const leaderboard = getLeaderboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading leaderboards...</p>
          <p className="text-sm text-slate-500 mt-2">Aggregating player statistics</p>
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
          <button onClick={fetchPlayers} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Leaderboards</h1>
          <p className="text-slate-600">Top performers across all matches</p>
          <p className="text-sm text-slate-500 mt-1">Based on most recent 1,000 matches per format</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { type: 'all' as FormatType, label: 'All Formats' },
            { type: 'test' as FormatType, label: 'Test' },
            { type: 'odi' as FormatType, label: 'ODI' },
            { type: 't20i' as FormatType, label: 'T20I' },
            { type: 'ipl' as FormatType, label: 'IPL' },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setSelectedFormat(type)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
                selectedFormat === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { type: 'runs' as LeaderboardType, label: 'Most Runs', icon: Trophy },
            { type: 'wickets' as LeaderboardType, label: 'Most Wickets', icon: Target },
            { type: 'batting_avg' as LeaderboardType, label: 'Best Average', icon: TrendingUp },
            { type: 'strike_rate' as LeaderboardType, label: 'Best Strike Rate', icon: TrendingUp },
            { type: 'economy' as LeaderboardType, label: 'Best Economy', icon: Target },
          ].map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => setSelectedBoard(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                selectedBoard === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Rank</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-slate-700">Player</th>
                  <th className="text-left px-4 py-4 text-sm font-semibold text-slate-700">Teams</th>

                  {selectedBoard === 'runs' && (
                    <>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Runs</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Balls</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">4s</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">6s</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">50/100</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Avg</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">SR</th>
                    </>
                  )}

                  {selectedBoard === 'wickets' && (
                    <>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Wkts</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Balls</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Runs</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Mdns</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">4W/5W</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Avg</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Econ</th>
                    </>
                  )}

                  {selectedBoard === 'batting_avg' && (
                    <>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Avg</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Runs</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Inns</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Balls</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">HS</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">50/100</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">SR</th>
                    </>
                  )}

                  {selectedBoard === 'strike_rate' && (
                    <>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">SR</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Runs</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Balls</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">4s</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">6s</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Avg</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">100/50</th>
                    </>
                  )}

                  {selectedBoard === 'economy' && (
                    <>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Econ</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Wkts</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Balls</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Runs</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Mdns</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Avg</th>
                      <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">SR</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaderboard.map((player, index) => (
                  <tr key={player.player} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/players/${encodeURIComponent(player.player)}`}
                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {player.player}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-600 truncate max-w-xs">
                        {player.teams.slice(0, 2).join(', ')}
                        {player.teams.length > 2 && '...'}
                      </div>
                    </td>

                    {selectedBoard === 'runs' && (
                      <>
                        <td className="px-3 py-4 text-center font-bold text-blue-600">{player.batting.runs}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.balls}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.fours}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.sixes}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.fifties}/{player.batting.hundreds}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.average.toFixed(2)}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.strike_rate.toFixed(2)}</td>
                      </>
                    )}

                    {selectedBoard === 'wickets' && (
                      <>
                        <td className="px-3 py-4 text-center font-bold text-blue-600">{player.bowling.wickets}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.balls}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.runs}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.maidens}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.four_wickets}/{player.bowling.five_wickets}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.average.toFixed(2)}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.economy.toFixed(2)}</td>
                      </>
                    )}

                    {selectedBoard === 'batting_avg' && (
                      <>
                        <td className="px-3 py-4 text-center font-bold text-blue-600">{player.batting.average.toFixed(2)}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.runs}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.innings}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.balls}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.highest_score}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.fifties}/{player.batting.hundreds}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.strike_rate.toFixed(2)}</td>
                      </>
                    )}

                    {selectedBoard === 'strike_rate' && (
                      <>
                        <td className="px-3 py-4 text-center font-bold text-blue-600">{player.batting.strike_rate.toFixed(2)}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.runs}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.balls}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.fours}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.sixes}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.average.toFixed(2)}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.batting.hundreds}/{player.batting.fifties}</td>
                      </>
                    )}

                    {selectedBoard === 'economy' && (
                      <>
                        <td className="px-3 py-4 text-center font-bold text-blue-600">{player.bowling.economy.toFixed(2)}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.wickets}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.balls}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.runs}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.maidens}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.average.toFixed(2)}</td>
                        <td className="px-3 py-4 text-center text-slate-700">{player.bowling.strike_rate.toFixed(2)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center text-slate-600">
          <p>Showing top {leaderboard.length} players</p>
        </div>
      </div>
    </div>
  );
}
