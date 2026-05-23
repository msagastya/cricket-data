/**
 * Individual Player API Route
 *
 * GET /api/players/[id] - Get detailed stats for a specific player
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { BatterInnings, BowlerInnings } from '@/types/cricket';

// In-memory cache (10 minute TTL)
let playerCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface DetailedPlayerStats {
  player: string;
  teams: string[];

  // Overall stats
  overall: {
    batting: any;
    bowling: any;
    fielding: {
      catches: number;
      stumpings: number;
      run_outs: number;
    };
  };

  // Format-wise breakdown
  by_format: Record<string, { batting: any; bowling: any; fielding: any }>;

  // Opposition-wise breakdown
  by_opposition: Record<string, { batting: any; bowling: any }>;

  // Innings-wise breakdown
  by_innings: {
    first: { batting: any; bowling: any };
    second: { batting: any; bowling: any };
  };

  // Recent matches
  recent_matches: any[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playerName = decodeURIComponent(id);

    // Check cache
    if (playerCache[playerName] && (Date.now() - playerCache[playerName].timestamp) < CACHE_TTL) {
      console.log(`✅ Returning cached data for ${playerName}`);
      return NextResponse.json(playerCache[playerName].data);
    }

    const db = getAdminFirestore();

    console.log(`📊 Fetching detailed stats for: ${playerName}`);
    const startTime = Date.now();

    // Initialize stats structure
    const stats: DetailedPlayerStats = {
      player: playerName,
      teams: [],
      overall: {
        batting: initBattingStats(),
        bowling: initBowlingStats(),
        fielding: { catches: 0, stumpings: 0, run_outs: 0 }
      },
      by_format: {},
      by_opposition: {},
      by_innings: {
        first: { batting: initBattingStats(), bowling: initBowlingStats() },
        second: { batting: initBattingStats(), bowling: initBowlingStats() }
      },
      recent_matches: []
    };

    const teamsSet = new Set<string>();

    // Fetch all matches
    const matchesSnapshot = await db.collection('matches')
      .orderBy('dates', 'desc')
      .get();

    console.log(`  ✓ Found ${matchesSnapshot.size} matches to analyze`);

    // Process each match
    for (const matchDoc of matchesSnapshot.docs) {
      const matchData = matchDoc.data();
      const matchId = matchDoc.id;

      const matchType = matchData.match_type?.toUpperCase() || 'UNKNOWN';
      const matchEvent = matchData.event?.name?.toLowerCase() || '';
      const isIPL = matchEvent.includes('ipl') || matchEvent.includes('indian premier league');
      const format = isIPL ? 'IPL' : matchType;

      const matchTeams = matchData.teams as [string, string];

      // Get innings data
      const inningsDoc = await db
        .collection('matches')
        .doc(matchId)
        .collection('data')
        .doc('innings')
        .get();

      if (!inningsDoc.exists) continue;

      const inningsData = inningsDoc.data();
      const innings = inningsData?.innings || [];

      let playerFoundInMatch = false;
      const matchDetails: any = {
        match_id: matchId,
        date: matchData.dates?.[0],
        teams: matchTeams,
        venue: matchData.venue,
        format,
        player_batting: null,
        player_bowling: null
      };

      // Process each innings
      innings.forEach((inn: any, innIndex: number) => {
        const battingTeam = inn.team;
        const bowlingTeam = matchTeams[0] === battingTeam ? matchTeams[1] : matchTeams[0];
        const isFirstInnings = innIndex < 2; // First 2 innings are typically "first innings"

        // Process batters
        if (inn.batters && Array.isArray(inn.batters)) {
          for (const batter of inn.batters as BatterInnings[]) {
            if (batter.player === playerName) {
              playerFoundInMatch = true;
              teamsSet.add(battingTeam);

              // Update overall batting stats
              updateBattingStats(stats.overall.batting, batter);

              // Update format-wise
              if (!stats.by_format[format]) stats.by_format[format] = { batting: initBattingStats(), bowling: initBowlingStats(), fielding: { catches: 0, stumpings: 0, run_outs: 0 } };
              updateBattingStats(stats.by_format[format].batting, batter);

              // Update opposition-wise
              if (!stats.by_opposition[bowlingTeam]) stats.by_opposition[bowlingTeam] = { batting: initBattingStats(), bowling: initBowlingStats() };
              updateBattingStats(stats.by_opposition[bowlingTeam].batting, batter);

              // Update innings-wise
              const inningsKey = isFirstInnings ? 'first' : 'second';
              updateBattingStats(stats.by_innings[inningsKey].batting, batter);

              matchDetails.player_batting = {
                runs: batter.runs,
                balls: batter.balls,
                fours: batter.fours || 0,
                sixes: batter.sixes || 0,
                dismissal: batter.dismissal || null
              };
            }
          }
        }

        // Process bowlers
        if (inn.bowlers && Array.isArray(inn.bowlers)) {
          for (const bowler of inn.bowlers as BowlerInnings[]) {
            if (bowler.player === playerName) {
              playerFoundInMatch = true;
              teamsSet.add(bowlingTeam);

              // Update overall bowling stats
              updateBowlingStats(stats.overall.bowling, bowler);

              // Update format-wise
              if (!stats.by_format[format]) stats.by_format[format] = { batting: initBattingStats(), bowling: initBowlingStats(), fielding: { catches: 0, stumpings: 0, run_outs: 0 } };
              updateBowlingStats(stats.by_format[format].bowling, bowler);

              // Update opposition-wise
              if (!stats.by_opposition[battingTeam]) stats.by_opposition[battingTeam] = { batting: initBattingStats(), bowling: initBowlingStats() };
              updateBowlingStats(stats.by_opposition[battingTeam].bowling, bowler);

              // Update innings-wise
              const inningsKey = isFirstInnings ? 'first' : 'second';
              updateBowlingStats(stats.by_innings[inningsKey].bowling, bowler);

              matchDetails.player_bowling = {
                wickets: bowler.wickets,
                runs: bowler.runs,
                overs: bowler.overs,
                maidens: bowler.maidens || 0,
                economy: bowler.overs > 0 ? (bowler.runs / bowler.overs).toFixed(2) : '0.00'
              };
            }
          }
        }

        // TODO: Process fielding (catches, stumpings, run_outs) from ball-by-ball data
      });

      if (playerFoundInMatch) {
        stats.recent_matches.push(matchDetails);
      }
    }

    stats.teams = Array.from(teamsSet);

    // Calculate averages
    calculateAverages(stats.overall.batting, stats.overall.bowling);
    Object.values(stats.by_format).forEach(f => calculateAverages(f.batting, f.bowling));
    Object.values(stats.by_opposition).forEach(o => calculateAverages(o.batting, o.bowling));
    calculateAverages(stats.by_innings.first.batting, stats.by_innings.first.bowling);
    calculateAverages(stats.by_innings.second.batting, stats.by_innings.second.bowling);

    // Keep only recent 20 matches
    stats.recent_matches = stats.recent_matches.slice(0, 20);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Fetched stats for ${playerName} in ${duration}s`);

    const responseData = {
      success: true,
      player: stats,
      matches_analyzed: matchesSnapshot.size
    };

    // Cache the response
    playerCache[playerName] = {
      data: responseData,
      timestamp: Date.now()
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('❌ Failed to fetch player:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch player',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function initBattingStats() {
  return {
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
    strike_rate: 0
  };
}

function initBowlingStats() {
  return {
    innings: 0,
    balls: 0,
    runs: 0,
    wickets: 0,
    maidens: 0,
    four_wickets: 0,
    five_wickets: 0,
    best_figures: { wickets: 0, runs: 0 },
    average: 0,
    economy: 0,
    strike_rate: 0
  };
}

function updateBattingStats(stats: any, batter: BatterInnings) {
  stats.innings += 1;
  stats.runs += batter.runs || 0;
  stats.balls += batter.balls || 0;
  stats.fours += batter.fours || 0;
  stats.sixes += batter.sixes || 0;

  if (batter.dismissal) stats.dismissals += 1;
  if (batter.runs === 0 && batter.dismissal) stats.ducks += 1;
  if (batter.runs >= 50 && batter.runs < 100) stats.fifties += 1;
  if (batter.runs >= 100) stats.hundreds += 1;
  if (batter.runs > stats.highest_score) stats.highest_score = batter.runs;
}

function updateBowlingStats(stats: any, bowler: BowlerInnings) {
  stats.innings += 1;
  const balls = Math.floor(bowler.overs) * 6 + ((bowler.overs % 1) * 10);
  stats.balls += balls;
  stats.runs += bowler.runs || 0;
  stats.wickets += bowler.wickets || 0;
  stats.maidens += bowler.maidens || 0;

  if (bowler.wickets === 4) stats.four_wickets += 1;
  if (bowler.wickets >= 5) stats.five_wickets += 1;

  if (bowler.wickets > stats.best_figures.wickets ||
      (bowler.wickets === stats.best_figures.wickets && bowler.runs < stats.best_figures.runs)) {
    stats.best_figures = { wickets: bowler.wickets, runs: bowler.runs };
  }
}

function calculateAverages(batting: any, bowling: any) {
  // Batting averages
  batting.average = batting.dismissals > 0 ? batting.runs / batting.dismissals : batting.runs;
  batting.strike_rate = batting.balls > 0 ? (batting.runs / batting.balls) * 100 : 0;

  // Bowling averages
  bowling.average = bowling.wickets > 0 ? bowling.runs / bowling.wickets : (bowling.runs > 0 ? 999 : 0);
  bowling.economy = bowling.balls > 0 ? (bowling.runs / bowling.balls) * 6 : 0;
  bowling.strike_rate = bowling.wickets > 0 ? bowling.balls / bowling.wickets : 0;
}
