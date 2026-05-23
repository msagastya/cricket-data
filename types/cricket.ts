/**
 * Core Cricket Data Types
 * Based on Cricsheet data structure
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type MatchFormat = 'Test' | 'ODI' | 'T20' | 'T20I' | 'ODM' | 'IT20';
export type Gender = 'male' | 'female';
export type InningsType = 'normal' | 'super_over';
export type TossDecision = 'bat' | 'field';
export type OutcomeType = 'wickets' | 'runs' | 'tie' | 'no result';
export type DismissalType =
  | 'caught'
  | 'bowled'
  | 'lbw'
  | 'run out'
  | 'stumped'
  | 'caught and bowled'
  | 'hit wicket'
  | 'obstructing the field'
  | 'handled the ball'
  | 'timed out'
  | 'retired hurt'
  | 'retired out';

export type MatchPhase = 'powerplay' | 'middle' | 'death' | 'new_ball' | 'old_ball';
export type BattingPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

// ============================================================================
// MATCH INFORMATION (Component 1)
// ============================================================================

export interface MatchInfo {
  match_id: string;
  match_number?: number;

  // When & Where
  dates: Date[];
  season: string;
  venue: string;
  city?: string;
  country?: string;

  // Competition
  event: {
    name: string;
    match_number?: number;
    stage?: string;
  };

  // Match Setup
  match_type: MatchFormat;
  gender: Gender;
  overs: number;
  balls_per_over: number;

  // Teams
  teams: [string, string];

  // Toss
  toss: {
    winner: string;
    decision: TossDecision;
  };

  // Officials
  umpires?: string[];
  referee?: string;
  reserve_umpire?: string;
  tv_umpire?: string;

  // Outcome
  outcome: {
    winner?: string;
    by?: {
      wickets?: number;
      runs?: number;
    };
    method?: string; // 'D/L', 'VJD', etc.
    result?: string; // 'tie', 'no result'
  };

  // Players
  player_of_match?: string[];
  players: {
    [team: string]: string[];
  };

  // Registry (player IDs)
  registry?: {
    people: {
      [player_name: string]: string; // player_id
    };
  };

  // Metadata
  created?: Date;
  updated?: Date;
  data_version?: string;
  cricsheet_version?: string;
}

// ============================================================================
// BALL-BY-BALL DATA (Component 2)
// ============================================================================

export interface Delivery {
  match_id: string;
  innings: number;
  over: number;
  ball: number;

  // Players involved
  batter: string;
  bowler: string;
  non_striker: string;

  // Runs
  runs: {
    batter: number;
    extras: number;
    total: number;
  };

  // Extras breakdown
  extras?: {
    wides?: number;
    noballs?: number;
    byes?: number;
    legbyes?: number;
    penalty?: number;
  };

  // Wickets
  wickets?: Wicket[];

  // Special events
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

  // Calculated fields
  phase?: MatchPhase;
  cumulative_runs?: number;
  cumulative_wickets?: number;
}

export interface Wicket {
  player_out: string;
  kind: DismissalType;
  fielders?: Array<{
    name: string;
    substitute?: boolean;
  }>;
}

// ============================================================================
// INNINGS SUMMARY
// ============================================================================

export interface Innings {
  match_id: string;
  innings: number;
  team: string;

  // Totals
  total_runs: number;
  total_wickets: number;
  overs: number;

  // Batting summary
  batters: BatterInnings[];

  // Bowling summary
  bowlers: BowlerInnings[];

  // Extras
  extras: {
    total: number;
    wides: number;
    noballs: number;
    byes: number;
    legbyes: number;
    penalty: number;
  };

  // Fall of wickets
  fow: Array<{
    runs: number;
    wickets: number;
    batter: string;
    over: number;
  }>;

  // Partnerships
  partnerships: Partnership[];

  // Phase-wise breakdown
  powerplay_runs?: number;
  middle_overs_runs?: number;
  death_overs_runs?: number;
}

export interface BatterInnings {
  player: string;
  player_id?: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  dismissal?: {
    kind: DismissalType;
    bowler?: string;
    fielders?: string[];
  };
  position: BattingPosition;
}

export interface BowlerInnings {
  player: string;
  player_id?: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noballs: number;
  dots: number;
  fours: number;
  sixes: number;
}

export interface Partnership {
  wicket: number;
  batters: [string, string];
  runs: number;
  balls: number;
  batter1_contribution: number;
  batter2_contribution: number;
  overs_range: [number, number];
}

// ============================================================================
// PLAYER STATISTICS
// ============================================================================

export interface PlayerProfile {
  player_id: string;
  name: string;
  full_name?: string;

  // Identifiers
  cricinfo_id?: string;
  cricsheet_id: string;

  // Basic info
  teams: string[];
  role?: 'batter' | 'bowler' | 'all-rounder' | 'wicket-keeper';
  batting_style?: 'right-hand bat' | 'left-hand bat';
  bowling_style?: string;

  // Career stats summary
  career_stats: {
    [format in MatchFormat]?: {
      batting: BattingStats;
      bowling?: BowlingStats;
      fielding?: FieldingStats;
    };
  };

  // Metadata
  debut?: {
    [format in MatchFormat]?: Date;
  };
  last_played?: Date;
  total_matches: number;
}

export interface BattingStats {
  matches: number;
  innings: number;
  not_outs: number;
  runs: number;
  highest_score: number;
  average: number;
  strike_rate: number;

  // Boundaries
  fours: number;
  sixes: number;
  boundary_percentage: number;

  // Milestones
  fifties: number;
  hundreds: number;
  double_hundreds?: number;

  // Consistency
  ducks: number;
  balls_faced: number;

  // Context-specific (calculated separately)
  vs_pace?: {
    runs: number;
    average: number;
    strike_rate: number;
  };
  vs_spin?: {
    runs: number;
    average: number;
    strike_rate: number;
  };
}

export interface BowlingStats {
  matches: number;
  innings: number;
  balls: number;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  average: number;
  economy: number;
  strike_rate: number;

  // Best performances
  best_innings: {
    wickets: number;
    runs: number;
    match_id: string;
  };
  best_match?: {
    wickets: number;
    runs: number;
    match_id: string;
  };

  // Milestones
  four_wickets: number;
  five_wickets: number;
  ten_wickets?: number;

  // Control
  dots: number;
  dot_percentage: number;
  wides: number;
  noballs: number;
}

export interface FieldingStats {
  matches: number;
  catches: number;
  stumpings?: number;
  run_outs: number;
  run_outs_direct?: number;
}

// ============================================================================
// TEAM STATISTICS
// ============================================================================

export interface TeamProfile {
  team_id: string;
  name: string;

  // Record
  record: {
    [format in MatchFormat]?: {
      played: number;
      won: number;
      lost: number;
      tied: number;
      no_result: number;
      win_percentage: number;
    };
  };

  // Context-specific records
  toss_record?: {
    won: number;
    win_after_winning_toss: number;
    win_after_losing_toss: number;
  };

  batting_first_record?: {
    played: number;
    won: number;
    win_percentage: number;
  };

  chasing_record?: {
    played: number;
    won: number;
    win_percentage: number;
  };
}

// ============================================================================
// VENUE STATISTICS
// ============================================================================

export interface VenueProfile {
  venue_id: string;
  name: string;
  city: string;
  country?: string;

  // Characteristics
  stats_by_format: {
    [format in MatchFormat]?: {
      matches_played: number;

      // Scoring
      avg_first_innings: number;
      avg_second_innings: number;
      highest_total: number;
      lowest_total: number;

      // Outcomes
      batting_first_wins: number;
      chasing_wins: number;
      chase_success_rate: number;

      // Phase analysis
      avg_powerplay_score: number;
      avg_death_overs_score?: number;

      // Bowling analysis
      pace_wickets: number;
      spin_wickets: number;
      pace_vs_spin_ratio: number;
    };
  };
}

// ============================================================================
// QUERY & FILTER TYPES
// ============================================================================

export interface QueryFilters {
  // Time dimension
  date_range?: {
    start: Date;
    end: Date;
  };
  seasons?: string[];
  years?: number[];

  // Player dimension
  players?: string[];
  batting_position?: BattingPosition[];

  // Team dimension
  teams?: string[];
  opposition?: string[];

  // Venue dimension
  venues?: string[];
  cities?: string[];
  countries?: string[];

  // Format dimension
  formats?: MatchFormat[];
  competitions?: string[];

  // Match context
  toss_won?: boolean;
  batting_first?: boolean;
  home_away?: 'home' | 'away' | 'neutral';
  match_result?: 'won' | 'lost' | 'tied' | 'nr';

  // Match phase
  phases?: MatchPhase[];
  overs_range?: [number, number];

  // Innings
  innings?: number[];

  // Match importance
  knockout?: boolean;

  // Minimum qualifications
  min_matches?: number;
  min_innings?: number;
  min_runs?: number;
  min_wickets?: number;
}

export interface QueryOptions {
  filters: QueryFilters;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// INSIGHTS & ANALYTICS
// ============================================================================

export type InsightType =
  | 'record'
  | 'milestone'
  | 'trend'
  | 'pattern'
  | 'anomaly'
  | 'correlation'
  | 'prediction'
  | 'matchup'
  | 'form';

export interface Insight {
  insight_id: string;
  type: InsightType;
  title: string;
  description: string;

  // Relevance
  relevance_score: number;
  tags: string[];

  // Context
  entities: {
    players?: string[];
    teams?: string[];
    venues?: string[];
    matches?: string[];
  };

  // Data
  data: any;

  // Metadata
  generated_at: Date;
  expires_at?: Date;
}

// ============================================================================
// LEADERBOARD
// ============================================================================

export interface LeaderboardEntry {
  rank: number;
  player_id?: string;
  team_id?: string;
  name: string;

  // Primary stat
  value: number;

  // Supporting stats
  matches: number;
  additional_stats?: Record<string, number>;

  // Trend
  previous_rank?: number;
  trend?: 'up' | 'down' | 'same';
}

export interface Leaderboard {
  leaderboard_id: string;
  title: string;
  description: string;

  // Filters applied
  filters: QueryFilters;

  // Stat type
  stat_type: 'runs' | 'wickets' | 'average' | 'strike_rate' | 'economy' | string;

  // Entries
  entries: LeaderboardEntry[];

  // Metadata
  last_updated: Date;
  total_qualified: number;
}

// ============================================================================
// ANALYSIS RESULTS
// ============================================================================

export interface ComparisonResult {
  entities: Array<{
    id: string;
    name: string;
    type: 'player' | 'team';
  }>;

  metrics: Array<{
    name: string;
    values: number[];
    unit?: string;
  }>;

  head_to_head?: {
    encounters: number;
    entity1_wins: number;
    entity2_wins: number;
    details: any[];
  };
}

export interface TrendAnalysis {
  entity_id: string;
  entity_name: string;
  entity_type: 'player' | 'team';

  metric: string;

  data_points: Array<{
    date: Date;
    value: number;
    context?: string;
  }>;

  trend: 'improving' | 'declining' | 'stable' | 'volatile';

  statistics: {
    peak_value: number;
    peak_date: Date;
    current_value: number;
    average: number;
    std_deviation: number;
  };
}

// ============================================================================
// UPLOAD & PROCESSING
// ============================================================================

export interface UploadStatus {
  upload_id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';

  progress?: {
    current: number;
    total: number;
    stage: string;
  };

  result?: {
    match_id: string;
    deliveries_processed: number;
    players_updated: number;
    warnings: string[];
  };

  error?: {
    message: string;
    details: any;
  };

  created_at: Date;
  completed_at?: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: string[];

  match_info?: {
    date: string;
    teams: string[];
    venue: string;
    format: string;
  };
}
