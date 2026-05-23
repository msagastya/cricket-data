/**
 * Players API Route
 *
 * GET /api/players - Get aggregated player statistics from all matches
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { BatterInnings, BowlerInnings } from '@/types/cricket';

// In-memory cache (10 minute TTL) - separate cache for each format
let playersCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface PlayerStats {
  player: string;
  teams: Set<string>;
  matches: number;

  // Batting stats
  batting: {
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
  };

  // Bowling stats
  bowling: {
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
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format'); // 'test', 'odi', 't20i', 'ipl', or null (all)

    const cacheKey = format || 'all';

    // Check cache first
    if (playersCache && playersCache[cacheKey] && (Date.now() - playersCache[cacheKey].timestamp) < CACHE_TTL) {
      console.log(`✅ Returning cached player data for ${cacheKey}`);
      return NextResponse.json(playersCache[cacheKey].data);
    }

    const db = getAdminFirestore();

    console.log(`📊 Aggregating player statistics (${cacheKey})...`);
    const startTime = Date.now();

    // Fetch all matches
    const matchesSnapshot = await db.collection('matches')
      .orderBy('dates', 'desc')
      .get();

    console.log(`  ✓ Found ${matchesSnapshot.size} matches`);

    // Map to store player statistics
    const playersMap = new Map<string, PlayerStats>();

    // Track matches with innings data
    const matchIds: string[] = [];

    // Process each match
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      const matchId = matchDoc.id;

      // Filter by format if specified
      const matchType = matchData.match_type?.toUpperCase() || '';
      const matchEvent = matchData.event?.name?.toLowerCase() || '';
      const isIPL = matchEvent.includes('ipl') || matchEvent.includes('indian premier league');

      // Skip based on format filter
      if (format === 'ipl' && !isIPL) continue;
      if (format === 'test' && matchType !== 'TEST') continue;
      if (format === 'odi' && matchType !== 'ODI') continue;
      if (format === 't20i' && matchType !== 'T20I') continue;

      matchIds.push(matchId);

      try {
        // Get innings data for this match
        const inningsDoc = await db
          .collection('matches')
          .doc(matchId)
          .collection('data')
          .doc('innings')
          .get();

        if (!inningsDoc.exists) {
          continue;
        }

        const inningsData = inningsDoc.data();
        const innings = inningsData?.innings || [];

        // Get the two teams in this match
        const matchTeams = matchData.teams as [string, string];

        // Process each innings
        for (const inn of innings) {
          const battingTeam = inn.team;
          // Bowlers are from the opposing team
          const bowlingTeam = matchTeams[0] === battingTeam ? matchTeams[1] : matchTeams[0];

          // Process batters
          if (inn.batters && Array.isArray(inn.batters)) {
            for (const batter of inn.batters as BatterInnings[]) {
              const playerName = batter.player;

              if (!playersMap.has(playerName)) {
                playersMap.set(playerName, {
                  player: playerName,
                  teams: new Set([battingTeam]),
                  matches: 0,
                  batting: {
                    innings: 0,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    highest_score: 0,
                    dismissals: 0,
                    fifties: 0,
                    hundreds: 0,
                    ducks: 0,
                    average: 0,
                    strike_rate: 0,
                  },
                  bowling: {
                    innings: 0,
                    balls: 0,
                    runs: 0,
                    wickets: 0,
                    maidens: 0,
                    dots: 0,
                    wides: 0,
                    noballs: 0,
                    best_figures: { wickets: 0, runs: 0 },
                    four_wickets: 0,
                    five_wickets: 0,
                    average: 0,
                    economy: 0,
                    strike_rate: 0,
                  },
                });
              }

              const stats = playersMap.get(playerName)!;
              stats.teams.add(battingTeam);

              // Update batting stats
              stats.batting.innings += 1;
              stats.batting.runs += batter.runs || 0;
              stats.batting.balls += batter.balls || 0;
              stats.batting.fours += batter.fours || 0;
              stats.batting.sixes += batter.sixes || 0;

              if (batter.dismissal) {
                stats.batting.dismissals += 1;
              }

              if (batter.runs === 0 && batter.dismissal) {
                stats.batting.ducks += 1;
              }

              if (batter.runs >= 50 && batter.runs < 100) {
                stats.batting.fifties += 1;
              }

              if (batter.runs >= 100) {
                stats.batting.hundreds += 1;
              }

              if (batter.runs > stats.batting.highest_score) {
                stats.batting.highest_score = batter.runs;
              }
            }
          }

          // Process bowlers
          if (inn.bowlers && Array.isArray(inn.bowlers)) {
            for (const bowler of inn.bowlers as BowlerInnings[]) {
              const playerName = bowler.player;

              if (!playersMap.has(playerName)) {
                playersMap.set(playerName, {
                  player: playerName,
                  teams: new Set([bowlingTeam]),
                  matches: 0,
                  batting: {
                    innings: 0,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    highest_score: 0,
                    dismissals: 0,
                    fifties: 0,
                    hundreds: 0,
                    ducks: 0,
                    average: 0,
                    strike_rate: 0,
                  },
                  bowling: {
                    innings: 0,
                    balls: 0,
                    runs: 0,
                    wickets: 0,
                    maidens: 0,
                    dots: 0,
                    wides: 0,
                    noballs: 0,
                    best_figures: { wickets: 0, runs: 0 },
                    four_wickets: 0,
                    five_wickets: 0,
                    average: 0,
                    economy: 0,
                    strike_rate: 0,
                  },
                });
              }

              const stats = playersMap.get(playerName)!;
              stats.teams.add(bowlingTeam);

              // Update bowling stats
              stats.bowling.innings += 1;
              const balls = Math.floor(bowler.overs) * 6 + ((bowler.overs % 1) * 10);
              stats.bowling.balls += balls;
              stats.bowling.runs += bowler.runs || 0;
              stats.bowling.wickets += bowler.wickets || 0;
              stats.bowling.maidens += bowler.maidens || 0;
              stats.bowling.dots += bowler.dots || 0;
              stats.bowling.wides += bowler.wides || 0;
              stats.bowling.noballs += bowler.noballs || 0;

              if (bowler.wickets === 4) {
                stats.bowling.four_wickets += 1;
              }

              if (bowler.wickets >= 5) {
                stats.bowling.five_wickets += 1;
              }

              // Update best figures
              if (bowler.wickets > stats.bowling.best_figures.wickets ||
                  (bowler.wickets === stats.bowling.best_figures.wickets &&
                   bowler.runs < stats.bowling.best_figures.runs)) {
                stats.bowling.best_figures = {
                  wickets: bowler.wickets,
                  runs: bowler.runs,
                };
              }
            }
          }
        }
      } catch (matchError) {
        console.error(`  ⚠️  Error processing match ${matchId}:`, matchError);
      }
    }

    // Calculate averages and convert to array
    const players = Array.from(playersMap.values()).map(stats => {
      // Calculate batting averages
      stats.batting.average = stats.batting.dismissals > 0
        ? stats.batting.runs / stats.batting.dismissals
        : stats.batting.runs;

      stats.batting.strike_rate = stats.batting.balls > 0
        ? (stats.batting.runs / stats.batting.balls) * 100
        : 0;

      // Calculate bowling averages
      stats.bowling.average = stats.bowling.wickets > 0
        ? stats.bowling.runs / stats.bowling.wickets
        : stats.bowling.runs > 0 ? 999 : 0;

      stats.bowling.economy = stats.bowling.balls > 0
        ? (stats.bowling.runs / stats.bowling.balls) * 6
        : 0;

      stats.bowling.strike_rate = stats.bowling.wickets > 0
        ? stats.bowling.balls / stats.bowling.wickets
        : 0;

      // Estimate matches (approximate based on innings)
      stats.matches = Math.max(
        Math.ceil(stats.batting.innings / 1.5),
        Math.ceil(stats.bowling.innings / 1.5)
      );

      return {
        ...stats,
        teams: Array.from(stats.teams),
      };
    });

    // Sort by total impact (runs + wickets * 20)
    players.sort((a, b) => {
      const impactA = a.batting.runs + (a.bowling.wickets * 20);
      const impactB = b.batting.runs + (b.bowling.wickets * 20);
      return impactB - impactA;
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Aggregated ${players.length} players in ${duration}s`);

    const responseData = {
      success: true,
      players,
      count: players.length,
      matches_analyzed: matchesSnapshot.size,
    };

    // Cache the response
    playersCache[cacheKey] = {
      data: responseData,
      timestamp: Date.now(),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Failed to fetch players:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch players',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
