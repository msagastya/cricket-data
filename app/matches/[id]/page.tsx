'use client';

/**
 * Match Details Page
 *
 * View complete match details, scorecard, and ball-by-ball data
 */

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Trophy, Loader2, AlertCircle, FileText, Activity, BarChart3 } from 'lucide-react';

interface MatchInfo {
  match_id: string;
  dates: string[];
  teams: [string, string];
  venue: string;
  city?: string;
  match_type: string;
  season: string;
  outcome: {
    winner?: string;
    by?: {
      runs?: number;
      wickets?: number;
    };
    result?: string;
  };
  event?: {
    name: string;
  };
  toss?: {
    winner: string;
    decision: string;
  };
  player_of_match?: string[];
}

interface Batter {
  player: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  dismissal?: {
    kind: string;
    fielders?: string[];
    bowler?: string;
  };
}

interface Bowler {
  player: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noballs: number;
}

interface Partnership {
  batters: string[];
  runs: number;
  balls: number;
}

interface Innings {
  innings: number;
  team: string;
  total_runs: number;
  total_wickets: number;
  total_overs?: string;
  run_rate?: number;
  batters: Batter[];
  bowlers: Bowler[];
  partnerships: Partnership[];
}

interface Delivery {
  match_id: string;
  innings: number;
  over: number;
  ball: number;
  batter: string;
  bowler: string;
  non_striker: string;
  runs: {
    batter: number;
    extras: number;
    total: number;
  };
  extras?: {
    wides?: number;
    noballs?: number;
    byes?: number;
    legbyes?: number;
    penalty?: number;
  };
  wickets?: Array<{
    player_out: string;
    kind: string;
    fielders?: string[];
  }>;
}

type TabType = 'scorecard' | 'ball-by-ball' | 'overs';

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [match, setMatch] = useState<MatchInfo | null>(null);
  const [innings, setInnings] = useState<Innings[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('scorecard');
  const [selectedInnings, setSelectedInnings] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMatch();
  }, [resolvedParams.id]);

  const fetchMatch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/matches/${resolvedParams.id}`);

      if (!response.ok) {
        throw new Error('Match not found');
      }

      const data = await response.json();
      setMatch(data.match);
      setInnings(data.innings || []);
      setDeliveries(data.deliveries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  // Get deliveries for selected innings
  const getInningsDeliveries = (inningsNum: number) => {
    return deliveries.filter(d => d.innings === inningsNum);
  };

  // Group deliveries by over
  const groupByOvers = (dels: Delivery[]) => {
    const overs: { [key: number]: Delivery[] } = {};
    dels.forEach(d => {
      if (!overs[d.over]) {
        overs[d.over] = [];
      }
      overs[d.over].push(d);
    });
    return overs;
  };

  // Calculate over summary
  const getOverSummary = (overDeliveries: Delivery[]) => {
    let runs = 0;
    let wickets = 0;
    let extras = 0;

    overDeliveries.forEach(d => {
      runs += d.runs.total;
      if (d.wickets && d.wickets.length > 0) {
        wickets += d.wickets.length;
      }
      if (d.runs.extras > 0) {
        extras += d.runs.extras;
      }
    });

    return { runs, wickets, extras };
  };

  // Format ball description
  const formatBallDescription = (delivery: Delivery) => {
    const parts: string[] = [];

    if (delivery.runs.batter > 0) {
      if (delivery.runs.batter === 4) {
        parts.push('FOUR');
      } else if (delivery.runs.batter === 6) {
        parts.push('SIX');
      } else {
        parts.push(`${delivery.runs.batter} run${delivery.runs.batter > 1 ? 's' : ''}`);
      }
    } else if (delivery.runs.total === 0) {
      parts.push('dot ball');
    }

    if (delivery.extras) {
      if (delivery.extras.wides) parts.push(`${delivery.extras.wides} wide${delivery.extras.wides > 1 ? 's' : ''}`);
      if (delivery.extras.noballs) parts.push(`no ball`);
      if (delivery.extras.byes) parts.push(`${delivery.extras.byes} bye${delivery.extras.byes > 1 ? 's' : ''}`);
      if (delivery.extras.legbyes) parts.push(`${delivery.extras.legbyes} leg bye${delivery.extras.legbyes > 1 ? 's' : ''}`);
    }

    if (delivery.wickets && delivery.wickets.length > 0) {
      delivery.wickets.forEach(w => {
        parts.push(`WICKET! ${w.player_out} ${w.kind}${w.fielders ? ` (${w.fielders.join(', ')})` : ''}`);
      });
    }

    return parts.join(', ') || 'No run';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Match Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'This match does not exist'}</p>
          <Link
            href="/matches"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Matches
          </Link>
        </div>
      </div>
    );
  }

  const currentInnings = innings.find(inn => inn.innings === selectedInnings);
  const inningsDeliveries = getInningsDeliveries(selectedInnings);
  const overGroups = groupByOvers(inningsDeliveries);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/matches"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Matches
        </Link>

        {/* Match Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {match.match_type}
                </span>
                {match.season && (
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
                    {match.season}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {match.teams[0]} vs {match.teams[1]}
              </h1>
              {match.event && (
                <p className="text-lg text-slate-600 flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500" />
                  {match.event.name}
                </p>
              )}
            </div>
          </div>

          {/* Match Info Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-500 mb-1">Date</p>
              <p className="flex items-center gap-2 text-slate-900 font-medium">
                <Calendar size={16} />
                {new Date(match.dates[0]).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500 mb-1">Venue</p>
              <p className="flex items-center gap-2 text-slate-900 font-medium">
                <MapPin size={16} />
                {match.venue}
                {match.city && `, ${match.city}`}
              </p>
            </div>

            {match.toss && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Toss</p>
                <p className="text-slate-900 font-medium">
                  {match.toss.winner} won and chose to {match.toss.decision}
                </p>
              </div>
            )}

            {match.player_of_match && match.player_of_match.length > 0 && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Player of the Match</p>
                <p className="text-slate-900 font-medium flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-500" />
                  {match.player_of_match.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Match Result */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Match Result</h2>

          {match.outcome.winner ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="text-green-600" size={32} />
                <h3 className="text-2xl font-bold text-green-900">
                  {match.outcome.winner} won
                </h3>
              </div>
              {match.outcome.by && (
                <p className="text-lg text-green-700 ml-11">
                  {match.outcome.by.runs && `by ${match.outcome.by.runs} runs`}
                  {match.outcome.by.wickets && `by ${match.outcome.by.wickets} wickets`}
                </p>
              )}
            </div>
          ) : match.outcome.result ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <p className="text-xl font-semibold text-slate-900 capitalize">
                {match.outcome.result}
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
              <p className="text-slate-600">Match result not available</p>
            </div>
          )}
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-slate-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === 'scorecard'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <FileText size={20} />
                Scorecard
              </button>
              <button
                onClick={() => setActiveTab('ball-by-ball')}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === 'ball-by-ball'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Activity size={20} />
                Ball-by-Ball
              </button>
              <button
                onClick={() => setActiveTab('overs')}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                  activeTab === 'overs'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 size={20} />
                Over Summary
              </button>
            </div>
          </div>

          {/* Innings Selector */}
          {innings.length > 0 && (
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
              <div className="flex gap-2">
                {innings.map((inn) => (
                  <button
                    key={inn.innings}
                    onClick={() => setSelectedInnings(inn.innings)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedInnings === inn.innings
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {inn.team} - {inn.total_runs}/{inn.total_wickets}
                    {inn.total_overs && ` (${inn.total_overs})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="p-6">
            {/* SCORECARD TAB */}
            {activeTab === 'scorecard' && currentInnings && (
              <div className="space-y-8">
                {/* Batting Card */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {currentInnings.team} Batting
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 text-left">
                          <th className="px-4 py-3 font-semibold text-slate-700">Batter</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">R</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">B</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">4s</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">6s</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">SR</th>
                          <th className="px-4 py-3 font-semibold text-slate-700">Dismissal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentInnings.batters.map((batter, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-200 hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {batter.player}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                              {batter.runs}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {batter.balls}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {batter.fours}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {batter.sixes}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {batter.strike_rate.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {batter.dismissal ? (
                                <span>
                                  {batter.dismissal.kind}
                                  {batter.dismissal.bowler && ` b ${batter.dismissal.bowler}`}
                                  {batter.dismissal.fielders &&
                                    batter.dismissal.fielders.length > 0 &&
                                    ` (${batter.dismissal.fielders.join(', ')})`}
                                </span>
                              ) : (
                                <span className="text-green-600 font-medium">Not out</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Innings Total */}
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        Total: {currentInnings.total_runs}/{currentInnings.total_wickets}
                        {currentInnings.total_overs && ` (${currentInnings.total_overs} overs)`}
                      </span>
                      {currentInnings.run_rate && (
                        <span className="text-slate-600">
                          Run Rate: {currentInnings.run_rate.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bowling Card */}
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Bowling</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 text-left">
                          <th className="px-4 py-3 font-semibold text-slate-700">Bowler</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">O</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">M</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">R</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">W</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">Econ</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">WD</th>
                          <th className="px-4 py-3 font-semibold text-slate-700 text-center">NB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentInnings.bowlers.map((bowler, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-200 hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 font-medium text-slate-900">
                              {bowler.player}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {bowler.overs}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {bowler.maidens}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {bowler.runs}
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-slate-900">
                              {bowler.wickets}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {bowler.economy.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {bowler.wides}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600">
                              {bowler.noballs}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Partnerships */}
                {currentInnings.partnerships.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Partnerships</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {currentInnings.partnerships.map((partnership, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">
                              Wicket {idx + 1}
                            </span>
                            <span className="text-lg font-bold text-slate-900">
                              {partnership.runs} runs
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {partnership.batters.join(' & ')} ({partnership.balls} balls)
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BALL-BY-BALL TAB */}
            {activeTab === 'ball-by-ball' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Ball-by-Ball Commentary
                </h3>
                {inningsDeliveries.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No delivery data available
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inningsDeliveries.map((delivery, idx) => (
                      <div
                        key={idx}
                        className={`border rounded-lg p-4 ${
                          delivery.wickets && delivery.wickets.length > 0
                            ? 'bg-red-50 border-red-300'
                            : delivery.runs.batter === 6
                            ? 'bg-green-50 border-green-300'
                            : delivery.runs.batter === 4
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded">
                                {delivery.over}.{delivery.ball}
                              </span>
                              <span className="font-medium text-slate-900">
                                {delivery.bowler} to {delivery.batter}
                              </span>
                            </div>
                            <p className="text-slate-700">
                              {formatBallDescription(delivery)}
                            </p>
                          </div>
                          <div className="flex flex-col items-center">
                            <span
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                                delivery.wickets && delivery.wickets.length > 0
                                  ? 'bg-red-600 text-white'
                                  : delivery.runs.total === 6
                                  ? 'bg-green-600 text-white'
                                  : delivery.runs.total === 4
                                  ? 'bg-blue-600 text-white'
                                  : delivery.runs.total > 0
                                  ? 'bg-slate-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {delivery.wickets && delivery.wickets.length > 0
                                ? 'W'
                                : delivery.runs.total}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* OVERS TAB */}
            {activeTab === 'overs' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Over-wise Summary</h3>
                {Object.keys(overGroups).length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    No over data available
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(overGroups)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([overNum, overDeliveries]) => {
                        const summary = getOverSummary(overDeliveries);
                        const bowler = overDeliveries[0]?.bowler;

                        return (
                          <div
                            key={overNum}
                            className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="text-sm font-medium text-slate-600 mb-1">
                                  Over {Number(overNum) + 1}
                                </div>
                                <div className="text-xs text-slate-500">{bowler}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">
                                  {summary.runs}
                                </div>
                                <div className="text-xs text-slate-500">runs</div>
                              </div>
                            </div>

                            {/* Over balls */}
                            <div className="flex gap-1 mb-2">
                              {overDeliveries.map((delivery, idx) => (
                                <div
                                  key={idx}
                                  className={`flex-1 h-8 rounded flex items-center justify-center text-xs font-bold ${
                                    delivery.wickets && delivery.wickets.length > 0
                                      ? 'bg-red-600 text-white'
                                      : delivery.runs.total === 6
                                      ? 'bg-green-600 text-white'
                                      : delivery.runs.total === 4
                                      ? 'bg-blue-600 text-white'
                                      : delivery.runs.total > 0
                                      ? 'bg-slate-600 text-white'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {delivery.wickets && delivery.wickets.length > 0
                                    ? 'W'
                                    : delivery.runs.total}
                                </div>
                              ))}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-between text-xs text-slate-600">
                              <span>Balls: {overDeliveries.length}</span>
                              {summary.wickets > 0 && (
                                <span className="text-red-600 font-medium">
                                  {summary.wickets} wicket{summary.wickets > 1 ? 's' : ''}
                                </span>
                              )}
                              {summary.extras > 0 && (
                                <span>{summary.extras} extra{summary.extras > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}

            {/* No data message */}
            {innings.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No match data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Match ID */}
        <div className="bg-slate-100 rounded-lg p-4 mt-8">
          <p className="text-xs text-slate-500 mb-1">Match ID</p>
          <p className="text-sm text-slate-700 font-mono">{match.match_id}</p>
        </div>
      </div>
    </div>
  );
}
