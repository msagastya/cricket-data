'use client';

/**
 * Matches List Page
 *
 * Browse and manage all uploaded cricket matches
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Trophy, Loader2, Trash2, AlertCircle } from 'lucide-react';

interface Match {
  match_id: string;
  dates: string[];
  teams: [string, string];
  venue: string;
  city?: string;
  match_type: string;
  outcome: {
    winner?: string;
    result?: string;
  };
  event?: {
    name: string;
  };
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [matches, selectedYear, selectedFormat, selectedTeam, selectedEvent]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/matches?limit=1000');

      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...matches];

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(m => {
        const year = new Date(m.dates[0]).getFullYear().toString();
        return year === selectedYear;
      });
    }

    // Filter by format
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(m => m.match_type === selectedFormat);
    }

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(m =>
        m.teams.includes(selectedTeam)
      );
    }

    // Filter by event
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(m =>
        m.event?.name === selectedEvent
      );
    }

    setFilteredMatches(filtered);
  };

  // Get unique values for filters
  const years = Array.from(new Set(matches.map(m => new Date(m.dates[0]).getFullYear().toString()))).sort().reverse();
  const formats = Array.from(new Set(matches.map(m => m.match_type))).sort();
  const teams = Array.from(new Set(matches.flatMap(m => m.teams))).sort();
  const events = Array.from(new Set(matches.map(m => m.event?.name).filter(Boolean) as string[])).sort();

  const deleteMatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to delete this match? This cannot be undone.')) {
      return;
    }

    setDeletingId(matchId);

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete match');
      }

      // Remove from list
      setMatches((prev) => prev.filter((m) => m.match_id !== matchId));
      alert('Match deleted successfully!');
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete match'}`);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading matches...</p>
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
            onClick={fetchMatches}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Matches Yet</h2>
          <p className="text-slate-600 mb-6">
            Upload your first Cricsheet file to start analyzing cricket data
          </p>
          <Link
            href="/admin/upload"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Data
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Matches</h1>
          <p className="text-slate-600">
            Showing {filteredMatches.length} of {matches.length} matches
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Formats</option>
            {formats.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>

          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">All Events</option>
            {events.map(event => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>

        {/* Matches Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match) => (
            <div
              key={match.match_id}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden relative group"
            >
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  deleteMatch(match.match_id);
                }}
                disabled={deletingId === match.match_id}
                className="absolute top-2 right-2 z-10 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:bg-slate-400"
                title="Delete match"
              >
                {deletingId === match.match_id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>

              <Link href={`/matches/${match.match_id}`}>
                {/* Match Header */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {match.match_type}
                    </span>
                    {match.outcome.winner && (
                      <Trophy className="text-yellow-500" size={20} />
                    )}
                  </div>

                  {/* Teams */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                      {match.teams[0]} vs {match.teams[1]}
                    </h3>
                    {match.outcome.winner && (
                      <p className="text-sm text-green-600 font-medium">
                        {match.outcome.winner} won
                      </p>
                    )}
                    {match.outcome.result && (
                      <p className="text-sm text-slate-600">{match.outcome.result}</p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm text-slate-600">
                    {match.event && (
                      <div className="flex items-center gap-2">
                        <Trophy size={16} />
                        <span className="truncate">{match.event.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>{new Date(match.dates[0]).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span className="truncate">
                        {match.venue}
                        {match.city ? `, ${match.city}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-mono truncate">
                    {match.match_id}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMatches.length === 0 && !loading && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Matches Found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your filters
            </p>
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedFormat('all');
                setSelectedTeam('all');
                setSelectedEvent('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Stats */}
        {filteredMatches.length > 0 && (
          <div className="mt-8 text-center text-slate-600">
            <p>
              Showing {filteredMatches.length} {filteredMatches.length === 1 ? 'match' : 'matches'}
              {(selectedYear !== 'all' || selectedFormat !== 'all' || selectedTeam !== 'all' || selectedEvent !== 'all') &&
                ` (filtered from ${matches.length} total)`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
