'use client';

/**
 * Player Profile Page
 * Detailed player statistics with format, opposition, and innings breakdowns
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft, Trophy, Target, Users, TrendingUp, Calendar } from 'lucide-react';

interface PlayerStats {
  player: string;
  teams: string[];
  overall: {
    batting: BattingStats;
    bowling: BowlingStats;
    fielding: FieldingStats;
  };
  by_format: Record<string, { batting: BattingStats; bowling: BowlingStats; fielding: FieldingStats }>;
  by_opposition: Record<string, { batting: BattingStats; bowling: BowlingStats }>;
  by_innings: {
    first: { batting: BattingStats; bowling: BowlingStats };
    second: { batting: BattingStats; bowling: BowlingStats };
  };
  recent_matches: RecentMatch[];
}

interface BattingStats {
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

interface BowlingStats {
  innings: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  four_wickets: number;
  five_wickets: number;
  best_figures: { wickets: number; runs: number };
  average: number;
  economy: number;
  strike_rate: number;
}

interface FieldingStats {
  catches: number;
  stumpings: number;
  run_outs: number;
}

interface RecentMatch {
  match_id: string;
  date: string;
  teams: [string, string];
  venue: string;
  format: string;
  player_batting: any;
  player_bowling: any;
}

type ViewTab = 'overview' | 'formats' | 'opposition' | 'innings' | 'matches';

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;
  const playerName = decodeURIComponent(playerId);

  const [playerData, setPlayerData] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');

  useEffect(() => {
    fetchPlayerData();
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/players/${encodeURIComponent(playerName)}`);
      if (!response.ok) throw new Error('Failed to fetch player data');
      const data = await response.json();
      setPlayerData(data.player);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading player profile...</p>
          <p className="text-sm text-slate-500 mt-2">Analyzing career statistics</p>
        </div>
      </div>
    );
  }

  if (error || !playerData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Error: {error || 'Player not found'}</p>
          <button
            onClick={() => router.push('/players')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Players
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
          <button
            onClick={() => router.push('/players')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Players
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{playerData.player}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {playerData.teams.map(team => (
                <span key={team} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {team}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <StatCard
                label="Total Runs"
                value={playerData.overall.batting.runs}
                icon={<Trophy className="text-yellow-600" size={20} />}
              />
              <StatCard
                label="Total Wickets"
                value={playerData.overall.bowling.wickets}
                icon={<Target className="text-red-600" size={20} />}
              />
              <StatCard
                label="Innings Played"
                value={playerData.overall.batting.innings}
                icon={<Users className="text-blue-600" size={20} />}
              />
              <StatCard
                label="Catches"
                value={playerData.overall.fielding.catches}
                icon={<TrendingUp className="text-green-600" size={20} />}
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview' as ViewTab, label: 'Overview' },
            { id: 'formats' as ViewTab, label: 'By Format' },
            { id: 'opposition' as ViewTab, label: 'Vs Opposition' },
            { id: 'innings' as ViewTab, label: 'By Innings' },
            { id: 'matches' as ViewTab, label: 'Recent Matches' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab data={playerData.overall} />}
        {activeTab === 'formats' && <FormatsTab data={playerData.by_format} />}
        {activeTab === 'opposition' && <OppositionTab data={playerData.by_opposition} />}
        {activeTab === 'innings' && <InningsTab data={playerData.by_innings} />}
        {activeTab === 'matches' && <MatchesTab matches={playerData.recent_matches} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }: { data: PlayerStats['overall'] }) {
  return (
    <div className="space-y-6">
      {/* Batting Stats */}
      {data.batting.innings > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-600" size={24} />
            Batting Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatBox label="Innings" value={data.batting.innings} />
            <StatBox label="Runs" value={data.batting.runs} highlight />
            <StatBox label="Balls" value={data.batting.balls} />
            <StatBox label="Average" value={data.batting.average.toFixed(2)} highlight />
            <StatBox label="Strike Rate" value={data.batting.strike_rate.toFixed(2)} />
            <StatBox label="Highest Score" value={data.batting.highest_score} />
            <StatBox label="100s" value={data.batting.hundreds} highlight />
            <StatBox label="50s" value={data.batting.fifties} highlight />
            <StatBox label="4s" value={data.batting.fours} />
            <StatBox label="6s" value={data.batting.sixes} />
            <StatBox label="Ducks" value={data.batting.ducks} />
            <StatBox label="Dismissals" value={data.batting.dismissals} />
          </div>
        </div>
      )}

      {/* Bowling Stats */}
      {data.bowling.innings > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Target className="text-red-600" size={24} />
            Bowling Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatBox label="Innings" value={data.bowling.innings} />
            <StatBox label="Wickets" value={data.bowling.wickets} highlight />
            <StatBox label="Runs" value={data.bowling.runs} />
            <StatBox label="Average" value={data.bowling.average.toFixed(2)} highlight />
            <StatBox label="Economy" value={data.bowling.economy.toFixed(2)} highlight />
            <StatBox label="Strike Rate" value={data.bowling.strike_rate.toFixed(2)} />
            <StatBox label="Best Figures" value={`${data.bowling.best_figures.wickets}/${data.bowling.best_figures.runs}`} highlight />
            <StatBox label="5 Wickets" value={data.bowling.five_wickets} />
            <StatBox label="4 Wickets" value={data.bowling.four_wickets} />
            <StatBox label="Maidens" value={data.bowling.maidens} />
            <StatBox label="Balls Bowled" value={data.bowling.balls} />
          </div>
        </div>
      )}

      {/* Fielding Stats */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-600" size={24} />
          Fielding Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatBox label="Catches" value={data.fielding.catches} highlight />
          <StatBox label="Stumpings" value={data.fielding.stumpings} />
          <StatBox label="Run Outs" value={data.fielding.run_outs} />
        </div>
      </div>
    </div>
  );
}

// Formats Tab Component
function FormatsTab({ data }: { data: PlayerStats['by_format'] }) {
  const formats = Object.keys(data).sort();

  if (formats.length === 0) {
    return <EmptyState message="No format-specific data available" />;
  }

  return (
    <div className="space-y-6">
      {formats.map(format => (
        <div key={format} className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">{format}</h2>

          {/* Batting */}
          {data[format].batting.innings > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Batting</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <StatBox label="Innings" value={data[format].batting.innings} small />
                <StatBox label="Runs" value={data[format].batting.runs} small highlight />
                <StatBox label="Avg" value={data[format].batting.average.toFixed(2)} small highlight />
                <StatBox label="SR" value={data[format].batting.strike_rate.toFixed(2)} small />
                <StatBox label="HS" value={data[format].batting.highest_score} small />
                <StatBox label="100s/50s" value={`${data[format].batting.hundreds}/${data[format].batting.fifties}`} small highlight />
              </div>
            </div>
          )}

          {/* Bowling */}
          {data[format].bowling.innings > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Bowling</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <StatBox label="Innings" value={data[format].bowling.innings} small />
                <StatBox label="Wickets" value={data[format].bowling.wickets} small highlight />
                <StatBox label="Avg" value={data[format].bowling.average.toFixed(2)} small highlight />
                <StatBox label="Econ" value={data[format].bowling.economy.toFixed(2)} small highlight />
                <StatBox label="SR" value={data[format].bowling.strike_rate.toFixed(2)} small />
                <StatBox label="Best" value={`${data[format].bowling.best_figures.wickets}/${data[format].bowling.best_figures.runs}`} small />
              </div>
            </div>
          )}

          {/* Fielding */}
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Fielding</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <StatBox label="Catches" value={data[format].fielding.catches} small />
              <StatBox label="Stumpings" value={data[format].fielding.stumpings} small />
              <StatBox label="Run Outs" value={data[format].fielding.run_outs} small />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Opposition Tab Component
function OppositionTab({ data }: { data: PlayerStats['by_opposition'] }) {
  const oppositions = Object.keys(data).sort();

  if (oppositions.length === 0) {
    return <EmptyState message="No opposition-specific data available" />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-4 text-sm font-semibold text-slate-700">Opposition</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Innings</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Runs</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Avg</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">SR</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">100/50</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Wkts</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Bowl Avg</th>
              <th className="text-center px-3 py-4 text-sm font-semibold text-slate-700">Econ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {oppositions.map(opp => (
              <tr key={opp} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-900">{opp}</td>
                <td className="px-3 py-3 text-center text-slate-700">{data[opp].batting.innings}</td>
                <td className="px-3 py-3 text-center font-bold text-blue-600">{data[opp].batting.runs}</td>
                <td className="px-3 py-3 text-center text-slate-700">{data[opp].batting.average.toFixed(2)}</td>
                <td className="px-3 py-3 text-center text-slate-700">{data[opp].batting.strike_rate.toFixed(2)}</td>
                <td className="px-3 py-3 text-center text-slate-700">{data[opp].batting.hundreds}/{data[opp].batting.fifties}</td>
                <td className="px-3 py-3 text-center font-bold text-red-600">{data[opp].bowling.wickets}</td>
                <td className="px-3 py-3 text-center text-slate-700">{data[opp].bowling.average.toFixed(2)}</td>
                <td className="px-3 py-3 text-center text-slate-700">{data[opp].bowling.economy.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Innings Tab Component
function InningsTab({ data }: { data: PlayerStats['by_innings'] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* 1st Innings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Batting/Bowling 1st</h2>

        {data.first.batting.innings > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Batting</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Innings" value={data.first.batting.innings} small />
              <StatBox label="Runs" value={data.first.batting.runs} small highlight />
              <StatBox label="Avg" value={data.first.batting.average.toFixed(2)} small highlight />
              <StatBox label="SR" value={data.first.batting.strike_rate.toFixed(2)} small />
              <StatBox label="HS" value={data.first.batting.highest_score} small />
              <StatBox label="100/50" value={`${data.first.batting.hundreds}/${data.first.batting.fifties}`} small />
            </div>
          </div>
        )}

        {data.first.bowling.innings > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Bowling</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Innings" value={data.first.bowling.innings} small />
              <StatBox label="Wickets" value={data.first.bowling.wickets} small highlight />
              <StatBox label="Avg" value={data.first.bowling.average.toFixed(2)} small highlight />
              <StatBox label="Econ" value={data.first.bowling.economy.toFixed(2)} small highlight />
              <StatBox label="SR" value={data.first.bowling.strike_rate.toFixed(2)} small />
              <StatBox label="Best" value={`${data.first.bowling.best_figures.wickets}/${data.first.bowling.best_figures.runs}`} small />
            </div>
          </div>
        )}
      </div>

      {/* 2nd Innings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Batting/Bowling 2nd</h2>

        {data.second.batting.innings > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Batting</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Innings" value={data.second.batting.innings} small />
              <StatBox label="Runs" value={data.second.batting.runs} small highlight />
              <StatBox label="Avg" value={data.second.batting.average.toFixed(2)} small highlight />
              <StatBox label="SR" value={data.second.batting.strike_rate.toFixed(2)} small />
              <StatBox label="HS" value={data.second.batting.highest_score} small />
              <StatBox label="100/50" value={`${data.second.batting.hundreds}/${data.second.batting.fifties}`} small />
            </div>
          </div>
        )}

        {data.second.bowling.innings > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-700 mb-3">Bowling</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Innings" value={data.second.bowling.innings} small />
              <StatBox label="Wickets" value={data.second.bowling.wickets} small highlight />
              <StatBox label="Avg" value={data.second.bowling.average.toFixed(2)} small highlight />
              <StatBox label="Econ" value={data.second.bowling.economy.toFixed(2)} small highlight />
              <StatBox label="SR" value={data.second.bowling.strike_rate.toFixed(2)} small />
              <StatBox label="Best" value={`${data.second.bowling.best_figures.wickets}/${data.second.bowling.best_figures.runs}`} small />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Recent Matches Tab Component
function MatchesTab({ matches }: { matches: RecentMatch[] }) {
  if (matches.length === 0) {
    return <EmptyState message="No recent match data available" />;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-4 text-sm font-semibold text-slate-700">Date</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-slate-700">Match</th>
              <th className="text-left px-4 py-4 text-sm font-semibold text-slate-700">Venue</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Format</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Batting</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-slate-700">Bowling</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {matches.map((match, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{match.date}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{match.teams.join(' vs ')}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{match.venue}</td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {match.format}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  {match.player_batting ? (
                    <span className="font-semibold text-slate-900">
                      {match.player_batting.runs}({match.player_batting.balls})
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  {match.player_bowling ? (
                    <span className="font-semibold text-slate-900">
                      {match.player_bowling.wickets}/{match.player_bowling.runs} ({match.player_bowling.overs})
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
      {icon}
      <div>
        <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
        <div className="text-sm text-slate-600">{label}</div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight, small }: { label: string; value: string | number; highlight?: boolean; small?: boolean }) {
  return (
    <div className={`${small ? 'p-3' : 'p-4'} bg-slate-50 rounded-lg`}>
      <div className={`${small ? 'text-lg' : 'text-2xl'} font-bold ${highlight ? 'text-blue-600' : 'text-slate-900'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className={`${small ? 'text-xs' : 'text-sm'} text-slate-600 mt-1`}>{label}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-600">{message}</p>
    </div>
  );
}
