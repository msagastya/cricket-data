/**
 * Cricsheet Parser
 *
 * Parses Cricsheet YAML/JSON files and extracts structured data
 * Handles all formats: Test, ODI, T20, domestic leagues
 */

import yaml from 'js-yaml';
import {
  MatchInfo,
  Delivery,
  Innings,
  BatterInnings,
  BowlerInnings,
  Partnership,
  Wicket,
  MatchPhase,
  DismissalType,
} from '@/types/cricket';

// ============================================================================
// RAW CRICSHEET TYPES (as they appear in YAML/JSON)
// ============================================================================

interface CricsheetMatch {
  info: CricsheetInfo;
  innings: CricsheetInnings[];
}

interface CricsheetInfo {
  balls_per_over?: number;
  city?: string;
  dates: string[];
  event?: {
    name: string;
    match_number?: number;
    stage?: string;
  };
  gender: 'male' | 'female';
  match_type: string;
  match_type_number?: number;
  officials?: {
    match_referees?: string[];
    reserve_umpires?: string[];
    tv_umpires?: string[];
    umpires?: string[];
  };
  outcome?: {
    winner?: string;
    by?: {
      innings?: number;
      runs?: number;
      wickets?: number;
    };
    method?: string;
    result?: string;
  };
  overs?: number;
  player_of_match?: string[];
  players: {
    [team: string]: string[];
  };
  registry?: {
    people: {
      [player_name: string]: string;
    };
  };
  season: string;
  team_type: string;
  teams: string[];
  toss?: {
    winner: string;
    decision: 'bat' | 'field';
  };
  venue: string;
}

interface CricsheetInnings {
  team: string;
  overs: CricsheetOver[];
  absent_hurt?: string[];
  super_over?: boolean;
}

interface CricsheetOver {
  over: number;
  deliveries: CricsheetDelivery[];
}

interface CricsheetDelivery {
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
    fielders?: Array<{
      name: string;
      substitute?: boolean;
    }>;
  }>;
  review?: {
    by: string;
    umpire: string;
    decision: string;
    type: string;
  };
  replacements?: {
    role: string;
    in: string;
    out: string;
    reason: string;
  };
}

// ============================================================================
// PARSER CLASS
// ============================================================================

export class CricsheetParser {
  /**
   * Parse a Cricsheet file (YAML or JSON)
   */
  static parseFile(content: string, format: 'yaml' | 'json' = 'yaml'): CricsheetMatch {
    try {
      if (format === 'yaml') {
        return yaml.load(content) as CricsheetMatch;
      } else {
        return JSON.parse(content) as CricsheetMatch;
      }
    } catch (error) {
      throw new Error(`Failed to parse Cricsheet file: ${error}`);
    }
  }

  /**
   * Extract match information
   */
  static extractMatchInfo(raw: CricsheetMatch): MatchInfo {
    const { info } = raw;

    // Generate match ID
    const matchId = this.generateMatchId(info);

    // Parse dates
    const dates = info.dates.map(d => new Date(d));

    const matchInfo: MatchInfo = {
      match_id: matchId,
      match_number: info.match_type_number,

      // When & Where
      dates,
      season: info.season,
      venue: info.venue,
      city: info.city,

      // Competition
      event: info.event || { name: 'Unknown' },

      // Match Setup
      match_type: this.normalizeMatchType(info.match_type),
      gender: info.gender,
      overs: info.overs || (info.match_type === 'Test' ? 0 : 50),
      balls_per_over: info.balls_per_over || 6,

      // Teams
      teams: [info.teams[0], info.teams[1]],

      // Toss
      toss: info.toss || { winner: '', decision: 'bat' },

      // Officials
      umpires: info.officials?.umpires,
      referee: info.officials?.match_referees?.[0],
      reserve_umpire: info.officials?.reserve_umpires?.[0],
      tv_umpire: info.officials?.tv_umpires?.[0],

      // Outcome
      outcome: info.outcome || {},

      // Players
      player_of_match: info.player_of_match,
      players: info.players,

      // Registry
      registry: info.registry,

      // Metadata
      created: new Date(),
      updated: new Date(),
    };

    return matchInfo;
  }

  /**
   * Extract ball-by-ball deliveries
   */
  static extractDeliveries(raw: CricsheetMatch, matchId: string): Delivery[] {
    const deliveries: Delivery[] = [];
    const matchType = this.normalizeMatchType(raw.info.match_type);
    const oversPerInnings = raw.info.overs || 50;

    raw.innings.forEach((innings, inningsIndex) => {
      let cumulativeRuns = 0;
      let cumulativeWickets = 0;

      innings.overs.forEach((over) => {
        over.deliveries.forEach((ball, ballIndex) => {
          cumulativeRuns += ball.runs.total;
          if (ball.wickets && ball.wickets.length > 0) {
            cumulativeWickets += ball.wickets.length;
          }

          const delivery: Delivery = {
            match_id: matchId,
            innings: inningsIndex + 1,
            over: over.over,
            ball: ballIndex + 1,

            // Players
            batter: ball.batter,
            bowler: ball.bowler,
            non_striker: ball.non_striker,

            // Runs
            runs: ball.runs,

            // Extras
            extras: ball.extras,

            // Wickets
            wickets: ball.wickets as Wicket[] | undefined,

            // Special events
            review: ball.review,
            replacements: ball.replacements,

            // Calculated fields
            phase: this.determinePhase(over.over, matchType, oversPerInnings),
            cumulative_runs: cumulativeRuns,
            cumulative_wickets: cumulativeWickets,
          };

          deliveries.push(delivery);
        });
      });
    });

    return deliveries;
  }

  /**
   * Calculate innings summaries from deliveries
   */
  static calculateInnings(
    raw: CricsheetMatch,
    deliveries: Delivery[],
    matchId: string
  ): Innings[] {
    const inningsSummaries: Innings[] = [];

    raw.innings.forEach((innings, inningsIndex) => {
      const inningsDeliveries = deliveries.filter(d => d.innings === inningsIndex + 1);

      // Calculate batter statistics
      const batterStats = this.calculateBatterStats(inningsDeliveries);

      // Calculate bowler statistics
      const bowlerStats = this.calculateBowlerStats(inningsDeliveries);

      // Calculate partnerships
      const partnerships = this.calculatePartnerships(inningsDeliveries);

      // Calculate extras
      const extras = this.calculateExtras(inningsDeliveries);

      // Calculate fall of wickets
      const fow = this.calculateFallOfWickets(inningsDeliveries);

      // Total runs and wickets
      const totalRuns = inningsDeliveries.reduce((sum, d) => sum + d.runs.total, 0);
      const totalWickets = inningsDeliveries.reduce(
        (sum, d) => sum + (d.wickets?.length || 0),
        0
      );

      // Calculate overs
      const lastDelivery = inningsDeliveries[inningsDeliveries.length - 1];
      const overs = lastDelivery ? lastDelivery.over + (lastDelivery.ball / 10) : 0;

      const inningsSummary: Innings = {
        match_id: matchId,
        innings: inningsIndex + 1,
        team: innings.team,

        total_runs: totalRuns,
        total_wickets: totalWickets,
        overs,

        batters: batterStats,
        bowlers: bowlerStats,
        extras,
        fow,
        partnerships,
      };

      inningsSummaries.push(inningsSummary);
    });

    return inningsSummaries;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate unique match ID
   */
  private static generateMatchId(info: CricsheetInfo): string {
    const format = this.normalizeMatchType(info.match_type).toLowerCase();
    const team1 = info.teams[0].toLowerCase().replace(/\s+/g, '_');
    const team2 = info.teams[1].toLowerCase().replace(/\s+/g, '_');
    const date = info.dates[0].replace(/-/g, '');
    const venue = info.venue.toLowerCase().replace(/\s+/g, '_').substring(0, 20);

    return `${format}_${team1}_vs_${team2}_${date}_${venue}`;
  }

  /**
   * Normalize match type to standard format
   */
  private static normalizeMatchType(matchType: string): any {
    const normalized = matchType.toUpperCase();
    if (normalized === 'TEST') return 'Test';
    if (normalized === 'ODI') return 'ODI';
    if (normalized === 'T20' || normalized === 'T20I') return 'T20';
    if (normalized === 'ODM') return 'ODM';
    if (normalized === 'IT20') return 'IT20';
    return matchType;
  }

  /**
   * Determine match phase based on over number
   */
  private static determinePhase(
    over: number,
    matchType: string,
    totalOvers: number
  ): MatchPhase {
    if (matchType === 'Test') {
      // Test matches don't have traditional phases
      // Can be classified by new ball vs old ball
      return over < 80 ? 'new_ball' : 'old_ball';
    }

    if (matchType === 'T20' || matchType === 'T20I' || matchType === 'IT20') {
      if (over < 6) return 'powerplay';
      if (over < 16) return 'middle';
      return 'death';
    }

    // ODI
    if (over < 10) return 'powerplay';
    if (over < 40) return 'middle';
    return 'death';
  }

  /**
   * Calculate batter statistics for an innings
   */
  private static calculateBatterStats(deliveries: Delivery[]): BatterInnings[] {
    const batterMap = new Map<string, any>();

    deliveries.forEach((delivery) => {
      const batter = delivery.batter;

      if (!batterMap.has(batter)) {
        batterMap.set(batter, {
          player: batter,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          dismissal: undefined,
        });
      }

      const stats = batterMap.get(batter);
      stats.runs += delivery.runs.batter;

      // Count legal deliveries (not wides)
      if (!delivery.extras?.wides) {
        stats.balls += 1;
      }

      // Count boundaries
      if (delivery.runs.batter === 4) stats.fours += 1;
      if (delivery.runs.batter === 6) stats.sixes += 1;

      // Record dismissal
      if (delivery.wickets) {
        const wicket = delivery.wickets.find(w => w.player_out === batter);
        if (wicket) {
          stats.dismissal = {
            kind: wicket.kind as DismissalType,
            bowler: delivery.bowler,
            fielders: wicket.fielders?.map(f => f.name),
          };
        }
      }
    });

    // Convert map to array and calculate strike rates
    const batters: BatterInnings[] = Array.from(batterMap.values()).map((stats, index) => ({
      ...stats,
      strike_rate: stats.balls > 0 ? (stats.runs / stats.balls) * 100 : 0,
      position: (index + 1) as any,
    }));

    return batters;
  }

  /**
   * Calculate bowler statistics for an innings
   */
  private static calculateBowlerStats(deliveries: Delivery[]): BowlerInnings[] {
    const bowlerMap = new Map<string, any>();

    deliveries.forEach((delivery) => {
      const bowler = delivery.bowler;

      if (!bowlerMap.has(bowler)) {
        bowlerMap.set(bowler, {
          player: bowler,
          balls: 0,
          runs: 0,
          wickets: 0,
          wides: 0,
          noballs: 0,
          dots: 0,
          fours: 0,
          sixes: 0,
          maidens: 0,
        });
      }

      const stats = bowlerMap.get(bowler);

      // Count balls (legal deliveries only)
      if (!delivery.extras?.wides) {
        stats.balls += 1;
      }

      // Add runs conceded
      stats.runs += delivery.runs.total;

      // Count wickets
      if (delivery.wickets && delivery.wickets.length > 0) {
        stats.wickets += delivery.wickets.length;
      }

      // Extras
      if (delivery.extras?.wides) stats.wides += delivery.extras.wides;
      if (delivery.extras?.noballs) stats.noballs += delivery.extras.noballs;

      // Dots, fours, sixes
      if (delivery.runs.total === 0) stats.dots += 1;
      if (delivery.runs.batter === 4) stats.fours += 1;
      if (delivery.runs.batter === 6) stats.sixes += 1;
    });

    // Convert to array and calculate derived stats
    const bowlers: BowlerInnings[] = Array.from(bowlerMap.values()).map((stats) => ({
      ...stats,
      overs: Math.floor(stats.balls / 6) + (stats.balls % 6) / 10,
      economy: stats.balls > 0 ? (stats.runs / stats.balls) * 6 : 0,
    }));

    return bowlers;
  }

  /**
   * Calculate partnerships
   */
  private static calculatePartnerships(deliveries: Delivery[]): Partnership[] {
    const partnerships: Partnership[] = [];
    let currentPartnership: any = null;
    let wicketNumber = 0;

    deliveries.forEach((delivery, index) => {
      const batters = [delivery.batter, delivery.non_striker].sort();

      // Start new partnership
      if (!currentPartnership) {
        currentPartnership = {
          wicket: wicketNumber + 1,
          batters: batters as [string, string],
          runs: 0,
          balls: 0,
          batter1_contribution: 0,
          batter2_contribution: 0,
          overs_range: [delivery.over, delivery.over],
        };
      }

      // Add runs to partnership
      currentPartnership.runs += delivery.runs.total;
      if (!delivery.extras?.wides) {
        currentPartnership.balls += 1;
      }

      // Track individual contributions
      if (delivery.batter === currentPartnership.batters[0]) {
        currentPartnership.batter1_contribution += delivery.runs.batter;
      } else {
        currentPartnership.batter2_contribution += delivery.runs.batter;
      }

      // Update over range
      currentPartnership.overs_range[1] = delivery.over;

      // End partnership on wicket
      if (delivery.wickets && delivery.wickets.length > 0) {
        partnerships.push({ ...currentPartnership });
        wicketNumber += 1;
        currentPartnership = null;
      }
    });

    // Add final partnership if innings ended without wicket
    if (currentPartnership) {
      partnerships.push(currentPartnership);
    }

    return partnerships;
  }

  /**
   * Calculate extras breakdown
   */
  private static calculateExtras(deliveries: Delivery[]) {
    const extras = {
      total: 0,
      wides: 0,
      noballs: 0,
      byes: 0,
      legbyes: 0,
      penalty: 0,
    };

    deliveries.forEach((delivery) => {
      if (delivery.extras) {
        if (delivery.extras.wides) extras.wides += delivery.extras.wides;
        if (delivery.extras.noballs) extras.noballs += delivery.extras.noballs;
        if (delivery.extras.byes) extras.byes += delivery.extras.byes;
        if (delivery.extras.legbyes) extras.legbyes += delivery.extras.legbyes;
        if (delivery.extras.penalty) extras.penalty += delivery.extras.penalty;
      }
    });

    extras.total = extras.wides + extras.noballs + extras.byes + extras.legbyes + extras.penalty;

    return extras;
  }

  /**
   * Calculate fall of wickets
   */
  private static calculateFallOfWickets(deliveries: Delivery[]) {
    const fow: Array<{ runs: number; wickets: number; batter: string; over: number }> = [];
    let wicketCount = 0;

    deliveries.forEach((delivery) => {
      if (delivery.wickets && delivery.wickets.length > 0) {
        delivery.wickets.forEach((wicket) => {
          wicketCount += 1;
          fow.push({
            runs: delivery.cumulative_runs || 0,
            wickets: wicketCount,
            batter: wicket.player_out,
            over: delivery.over,
          });
        });
      }
    });

    return fow;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example usage:
 *
 * const fileContent = fs.readFileSync('match.yaml', 'utf-8');
 * const raw = CricsheetParser.parseFile(fileContent, 'yaml');
 * const matchInfo = CricsheetParser.extractMatchInfo(raw);
 * const deliveries = CricsheetParser.extractDeliveries(raw, matchInfo.match_id);
 * const innings = CricsheetParser.calculateInnings(raw, deliveries, matchInfo.match_id);
 */
