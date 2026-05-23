/**
 * Storage Service
 *
 * Handles all Firestore database operations for cricket data
 * Stores matches, updates player/team stats, manages aggregations
 */

import { getAdminFirestore, getAdminStorage } from '@/lib/firebase-admin';
import {
  MatchInfo,
  Delivery,
  Innings,
  BatterInnings,
  BowlerInnings,
  PlayerProfile,
  BattingStats,
  BowlingStats,
  TeamProfile,
  VenueProfile,
  UploadStatus,
} from '@/types/cricket';
import { FieldValue } from 'firebase-admin/firestore';

// ============================================================================
// STORAGE SERVICE CLASS
// ============================================================================

export class StorageService {
  private db = getAdminFirestore();
  private storage = getAdminStorage();

  // ==========================================================================
  // MATCH OPERATIONS
  // ==========================================================================

  /**
   * Save complete match data - OPTIMIZED FOR FIRESTORE
   * - Match metadata → 1 document
   * - Innings summaries → 1 document
   * - Deliveries (all) → 1 document (compressed JSON)
   * TOTAL: ~3 writes per match (vs 500 before!)
   */
  async saveMatch(
    matchInfo: MatchInfo,
    deliveries: Delivery[],
    innings: Innings[],
    originalMatchData?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const matchRef = this.db.collection('matches').doc(matchInfo.match_id);

      // Use batch writes for atomicity
      const batch = this.db.batch();

      // 1. Save match metadata
      const metadata = {
        ...this.serializeMatchInfo(matchInfo),
        deliveries_count: deliveries.length,
      };
      batch.set(matchRef, metadata);

      // 2. Save innings summaries as single document
      const inningsSummaries = innings.map((inn) => ({
        innings: inn.innings,
        team: inn.team,
        total_runs: inn.total_runs,
        total_wickets: inn.total_wickets,
        total_overs: inn.total_overs,
        run_rate: inn.run_rate,
        batters: inn.batters,
        bowlers: inn.bowlers,
        partnerships: inn.partnerships,
      }));

      batch.set(matchRef.collection('data').doc('innings'), {
        innings: inningsSummaries,
      });

      // 3. Save ALL deliveries as single JSON document
      // This is the KEY optimization: 1 write instead of 400-600!
      batch.set(matchRef.collection('data').doc('deliveries'), {
        deliveries: deliveries,
        count: deliveries.length,
      });

      // Commit all at once
      await batch.commit();

      console.log(`✅ Match saved: ${matchInfo.match_id} (Firestore writes: 3)`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving match:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save deliveries in batches (Firestore has 500 writes per batch limit)
   */
  private async saveDeliveries(matchId: string, deliveries: Delivery[]): Promise<void> {
    const matchRef = this.db.collection('matches').doc(matchId);
    const deliveriesRef = matchRef.collection('deliveries');

    // Batch deliveries (500 per batch max)
    const BATCH_SIZE = 500;
    let batch = this.db.batch();
    let count = 0;

    for (const delivery of deliveries) {
      const deliveryId = `innings_${delivery.innings}_over_${delivery.over}_ball_${delivery.ball}`;
      const deliveryRef = deliveriesRef.doc(deliveryId);

      batch.set(deliveryRef, delivery);
      count++;

      // Commit batch when it reaches limit
      if (count >= BATCH_SIZE) {
        await batch.commit();
        batch = this.db.batch();
        count = 0;
      }
    }

    // Commit remaining deliveries
    if (count > 0) {
      await batch.commit();
    }

    console.log(`  ✓ Saved ${deliveries.length} deliveries`);
  }

  /**
   * Check if match already exists
   */
  async matchExists(matchId: string): Promise<boolean> {
    const doc = await this.db.collection('matches').doc(matchId).get();
    return doc.exists;
  }

  /**
   * Get match by ID (metadata only from Firestore)
   */
  async getMatch(matchId: string): Promise<MatchInfo | null> {
    const doc = await this.db.collection('matches').doc(matchId).get();
    if (!doc.exists) return null;

    return this.deserializeMatchInfo(doc.data() as any);
  }

  /**
   * Get full match data from Firebase Storage (includes deliveries)
   */
  async getFullMatchData(matchId: string): Promise<any | null> {
    try {
      // Get storage path from Firestore metadata
      const doc = await this.db.collection('matches').doc(matchId).get();
      if (!doc.exists) return null;

      const data = doc.data();
      const storagePath = data?.storage_path || `matches/${matchId}.json`;

      // Fetch from Storage
      const bucket = this.storage.bucket();
      const file = bucket.file(storagePath);

      const [exists] = await file.exists();
      if (!exists) {
        console.warn(`Storage file not found: ${storagePath}`);
        return null;
      }

      const [contents] = await file.download();
      return JSON.parse(contents.toString('utf8'));
    } catch (error) {
      console.error('Error fetching from Storage:', error);
      return null;
    }
  }

  /**
   * Get innings for a match
   */
  async getInnings(matchId: string): Promise<Innings[]> {
    const inningsSnapshot = await this.db
      .collection('matches')
      .doc(matchId)
      .collection('innings')
      .orderBy('innings')
      .get();

    return inningsSnapshot.docs.map((doc) => doc.data() as Innings);
  }

  /**
   * Get deliveries for a match
   */
  async getDeliveries(matchId: string, limit?: number): Promise<Delivery[]> {
    let query = this.db
      .collection('matches')
      .doc(matchId)
      .collection('deliveries')
      .orderBy('innings')
      .orderBy('over')
      .orderBy('ball');

    if (limit) {
      query = query.limit(limit) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as Delivery);
  }

  // ==========================================================================
  // PLAYER OPERATIONS
  // ==========================================================================

  /**
   * Update player statistics after match import
   */
  async updatePlayerStats(
    playerId: string,
    playerName: string,
    matchInfo: MatchInfo,
    battingInnings?: BatterInnings,
    bowlingInnings?: BowlerInnings
  ): Promise<void> {
    const playerRef = this.db.collection('players').doc(playerId);

    try {
      // Get existing player or create new
      const playerDoc = await playerRef.get();
      let playerData: any;

      if (!playerDoc.exists) {
        // Create new player profile
        playerData = {
          player_id: playerId,
          name: playerName,
          teams: [matchInfo.teams[0], matchInfo.teams[1]],
          total_matches: 0,
          career_stats: {},
          updated: new Date(),
        };
      } else {
        playerData = playerDoc.data();
      }

      // Update total matches
      playerData.total_matches = (playerData.total_matches || 0) + 1;

      // Initialize format stats if needed
      const format = matchInfo.match_type;
      if (!playerData.career_stats[format]) {
        playerData.career_stats[format] = {
          batting: this.initBattingStats(),
          bowling: this.initBowlingStats(),
        };
      }

      // Update batting stats
      if (battingInnings) {
        this.updateBattingStats(playerData.career_stats[format].batting, battingInnings);
      }

      // Update bowling stats
      if (bowlingInnings) {
        this.updateBowlingStats(playerData.career_stats[format].bowling, bowlingInnings);
      }

      // Save updated player
      await playerRef.set(playerData, { merge: true });
    } catch (error) {
      console.error(`Error updating player ${playerId}:`, error);
    }
  }

  /**
   * Initialize empty batting stats
   */
  private initBattingStats(): BattingStats {
    return {
      matches: 0,
      innings: 0,
      not_outs: 0,
      runs: 0,
      highest_score: 0,
      average: 0,
      strike_rate: 0,
      fours: 0,
      sixes: 0,
      boundary_percentage: 0,
      fifties: 0,
      hundreds: 0,
      ducks: 0,
      balls_faced: 0,
    };
  }

  /**
   * Initialize empty bowling stats
   */
  private initBowlingStats(): BowlingStats {
    return {
      matches: 0,
      innings: 0,
      balls: 0,
      overs: 0,
      maidens: 0,
      runs: 0,
      wickets: 0,
      average: 0,
      economy: 0,
      strike_rate: 0,
      best_innings: { wickets: 0, runs: 0, match_id: '' },
      four_wickets: 0,
      five_wickets: 0,
      dots: 0,
      dot_percentage: 0,
      wides: 0,
      noballs: 0,
    };
  }

  /**
   * Update batting statistics
   */
  private updateBattingStats(stats: BattingStats, innings: BatterInnings): void {
    stats.innings += 1;
    stats.runs += innings.runs;
    stats.balls_faced += innings.balls;
    stats.fours += innings.fours;
    stats.sixes += innings.sixes;

    if (!innings.dismissal) {
      stats.not_outs += 1;
    }

    if (innings.runs === 0 && innings.dismissal) {
      stats.ducks += 1;
    }

    if (innings.runs >= 50 && innings.runs < 100) {
      stats.fifties += 1;
    }

    if (innings.runs >= 100) {
      stats.hundreds += 1;
    }

    if (innings.runs > stats.highest_score) {
      stats.highest_score = innings.runs;
    }

    // Recalculate averages
    const dismissals = stats.innings - stats.not_outs;
    stats.average = dismissals > 0 ? stats.runs / dismissals : stats.runs;
    stats.strike_rate = stats.balls_faced > 0 ? (stats.runs / stats.balls_faced) * 100 : 0;
    stats.boundary_percentage =
      stats.balls_faced > 0 ? ((stats.fours + stats.sixes) / stats.balls_faced) * 100 : 0;
  }

  /**
   * Update bowling statistics
   */
  private updateBowlingStats(stats: BowlingStats, innings: BowlerInnings): void {
    stats.innings += 1;
    stats.balls += innings.balls;
    stats.runs += innings.runs;
    stats.wickets += innings.wickets;
    stats.maidens += innings.maidens;
    stats.wides += innings.wides;
    stats.noballs += innings.noballs;
    stats.dots += innings.dots;

    if (innings.wickets === 4) stats.four_wickets += 1;
    if (innings.wickets >= 5) stats.five_wickets += 1;

    // Recalculate averages
    stats.overs = Math.floor(stats.balls / 6) + (stats.balls % 6) / 10;
    stats.average = stats.wickets > 0 ? stats.runs / stats.wickets : 0;
    stats.economy = stats.balls > 0 ? (stats.runs / stats.balls) * 6 : 0;
    stats.strike_rate = stats.wickets > 0 ? stats.balls / stats.wickets : 0;
    stats.dot_percentage = stats.balls > 0 ? (stats.dots / stats.balls) * 100 : 0;
  }

  // ==========================================================================
  // TEAM OPERATIONS
  // ==========================================================================

  /**
   * Update team statistics after match
   */
  async updateTeamStats(matchInfo: MatchInfo): Promise<void> {
    const { teams, outcome, match_type, toss } = matchInfo;

    for (const team of teams) {
      const teamRef = this.db.collection('teams').doc(team.toLowerCase().replace(/\s+/g, '_'));

      try {
        const teamDoc = await teamRef.get();
        let teamData: any;

        if (!teamDoc.exists) {
          teamData = {
            team_id: team.toLowerCase().replace(/\s+/g, '_'),
            name: team,
            record: {},
          };
        } else {
          teamData = teamDoc.data();
        }

        // Initialize format record if needed
        if (!teamData.record[match_type]) {
          teamData.record[match_type] = {
            played: 0,
            won: 0,
            lost: 0,
            tied: 0,
            no_result: 0,
            win_percentage: 0,
          };
        }

        const record = teamData.record[match_type];
        record.played += 1;

        // Update win/loss
        if (outcome.winner === team) {
          record.won += 1;
        } else if (outcome.result === 'tie') {
          record.tied += 1;
        } else if (outcome.result === 'no result') {
          record.no_result += 1;
        } else if (outcome.winner) {
          record.lost += 1;
        }

        // Recalculate win percentage
        const decisiveGames = record.played - record.tied - record.no_result;
        record.win_percentage = decisiveGames > 0 ? (record.won / decisiveGames) * 100 : 0;

        await teamRef.set(teamData, { merge: true });
      } catch (error) {
        console.error(`Error updating team ${team}:`, error);
      }
    }
  }

  // ==========================================================================
  // VENUE OPERATIONS
  // ==========================================================================

  /**
   * Update venue statistics
   */
  async updateVenueStats(matchInfo: MatchInfo, innings: Innings[]): Promise<void> {
    const venueId = matchInfo.venue.toLowerCase().replace(/\s+/g, '_');
    const venueRef = this.db.collection('venues').doc(venueId);

    try {
      const venueDoc = await venueRef.get();
      let venueData: any;

      if (!venueDoc.exists) {
        venueData = {
          venue_id: venueId,
          name: matchInfo.venue,
          city: matchInfo.city,
          stats_by_format: {},
        };
      } else {
        venueData = venueDoc.data();
      }

      const format = matchInfo.match_type;
      if (!venueData.stats_by_format[format]) {
        venueData.stats_by_format[format] = {
          matches_played: 0,
          avg_first_innings: 0,
          avg_second_innings: 0,
          highest_total: 0,
          lowest_total: 0,
          batting_first_wins: 0,
          chasing_wins: 0,
          chase_success_rate: 0,
        };
      }

      const stats = venueData.stats_by_format[format];
      stats.matches_played += 1;

      // Update innings averages
      if (innings[0]) {
        const totalRuns = innings[0].total_runs;
        stats.avg_first_innings =
          (stats.avg_first_innings * (stats.matches_played - 1) + totalRuns) /
          stats.matches_played;

        if (!stats.highest_total || totalRuns > stats.highest_total) {
          stats.highest_total = totalRuns;
        }

        if (!stats.lowest_total || totalRuns < stats.lowest_total) {
          stats.lowest_total = totalRuns;
        }
      }

      if (innings[1]) {
        const totalRuns = innings[1].total_runs;
        stats.avg_second_innings =
          (stats.avg_second_innings * (stats.matches_played - 1) + totalRuns) /
          stats.matches_played;
      }

      await venueRef.set(venueData, { merge: true });
    } catch (error) {
      console.error(`Error updating venue ${matchInfo.venue}:`, error);
    }
  }

  // ==========================================================================
  // UPLOAD STATUS TRACKING
  // ==========================================================================

  /**
   * Create upload status document
   */
  async createUploadStatus(uploadId: string, filename: string): Promise<void> {
    const statusRef = this.db.collection('upload_status').doc(uploadId);

    await statusRef.set({
      upload_id: uploadId,
      filename,
      status: 'processing',
      created_at: new Date(),
    });
  }

  /**
   * Update upload status
   */
  async updateUploadStatus(uploadId: string, update: Partial<UploadStatus>): Promise<void> {
    const statusRef = this.db.collection('upload_status').doc(uploadId);
    await statusRef.update(update);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Serialize match info for Firestore (convert Dates to timestamps)
   */
  private serializeMatchInfo(matchInfo: MatchInfo): any {
    return {
      ...matchInfo,
      dates: matchInfo.dates.map((d) => d.toISOString()),
      created: new Date(),
      updated: new Date(),
    };
  }

  /**
   * Deserialize match info from Firestore
   */
  private deserializeMatchInfo(data: any): MatchInfo {
    return {
      ...data,
      dates: data.dates.map((d: string) => new Date(d)),
      created: data.created?.toDate(),
      updated: data.updated?.toDate(),
    };
  }

  /**
   * Serialize innings for Firestore
   */
  private serializeInnings(innings: Innings): any {
    return innings;
  }

  /**
   * Get all matches (paginated)
   */
  async getMatches(limit: number = 50, startAfter?: string): Promise<MatchInfo[]> {
    let query = this.db.collection('matches').orderBy('dates', 'desc').limit(limit);

    if (startAfter) {
      const startDoc = await this.db.collection('matches').doc(startAfter).get();
      query = query.startAfter(startDoc) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => this.deserializeMatchInfo(doc.data()));
  }

  /**
   * Get recent uploads
   */
  async getRecentUploads(limit: number = 20): Promise<UploadStatus[]> {
    const snapshot = await this.db
      .collection('upload_status')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as UploadStatus);
  }
}

// Export singleton instance
export const storageService = new StorageService();
