/**
 * Data Validator
 *
 * Validates Cricsheet data using Zod schemas
 * Ensures data integrity and catches malformed files
 */

import { z } from 'zod';
import { ValidationResult } from '@/types/cricket';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const CricsheetDeliverySchema = z.object({
  batter: z.string(),
  bowler: z.string(),
  non_striker: z.string(),
  runs: z.object({
    batter: z.number(),
    extras: z.number(),
    total: z.number(),
  }),
  extras: z
    .object({
      wides: z.number().optional(),
      noballs: z.number().optional(),
      byes: z.number().optional(),
      legbyes: z.number().optional(),
      penalty: z.number().optional(),
    })
    .optional(),
  wickets: z
    .array(
      z.object({
        player_out: z.string(),
        kind: z.string(),
        fielders: z
          .array(
            z.object({
              name: z.string(),
              substitute: z.boolean().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  review: z.any().optional(),
  replacements: z.any().optional(),
});

const CricsheetOverSchema = z.object({
  over: z.number(),
  deliveries: z.array(CricsheetDeliverySchema),
});

const CricsheetInningsSchema = z.object({
  team: z.string(),
  overs: z.array(CricsheetOverSchema),
  super_over: z.boolean().optional(),
  absent_hurt: z.array(z.string()).optional(),
});

const CricsheetInfoSchema = z.object({
  balls_per_over: z.number().optional(),
  city: z.string().optional(),
  dates: z.array(z.string()),
  event: z
    .object({
      name: z.string(),
      match_number: z.number().optional(),
      stage: z.string().optional(),
    })
    .optional(),
  gender: z.enum(['male', 'female']),
  match_type: z.string(),
  match_type_number: z.number().optional(),
  officials: z
    .object({
      match_referees: z.array(z.string()).optional(),
      reserve_umpires: z.array(z.string()).optional(),
      tv_umpires: z.array(z.string()).optional(),
      umpires: z.array(z.string()).optional(),
    })
    .optional(),
  outcome: z
    .object({
      winner: z.string().optional(),
      by: z
        .object({
          innings: z.number().optional(),
          runs: z.number().optional(),
          wickets: z.number().optional(),
        })
        .optional(),
      method: z.string().optional(),
      result: z.string().optional(),
    })
    .optional(),
  overs: z.number().optional(),
  player_of_match: z.array(z.string()).optional(),
  players: z.record(z.array(z.string())),
  registry: z
    .object({
      people: z.record(z.string()),
    })
    .optional(),
  season: z.union([z.string(), z.number()]).transform(String),
  team_type: z.string(),
  teams: z.array(z.string()).length(2),
  toss: z
    .object({
      winner: z.string(),
      decision: z.enum(['bat', 'field']),
    })
    .optional(),
  venue: z.string(),
});

const CricsheetMatchSchema = z.object({
  info: CricsheetInfoSchema,
  innings: z.array(CricsheetInningsSchema),
});

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

export class CricsheetValidator {
  /**
   * Validate a Cricsheet match object
   */
  static validate(data: unknown): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    try {
      // Schema validation
      const parsed = CricsheetMatchSchema.parse(data);

      // Extract basic match info for preview
      result.match_info = {
        date: parsed.info.dates[0],
        teams: parsed.info.teams,
        venue: parsed.info.venue,
        format: parsed.info.match_type,
      };

      // Additional validation checks
      this.validateBusinessRules(parsed, result);
    } catch (error) {
      result.valid = false;

      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          result.errors.push({
            field: err.path.join('.'),
            message: err.message,
            severity: 'error',
          });
        });
      } else {
        result.errors.push({
          field: 'unknown',
          message: error instanceof Error ? error.message : 'Unknown validation error',
          severity: 'error',
        });
      }
    }

    return result;
  }

  /**
   * Business rule validation (beyond schema)
   */
  private static validateBusinessRules(data: any, result: ValidationResult): void {
    const { info, innings } = data;

    // Check: Must have exactly 2 teams
    if (info.teams.length !== 2) {
      result.errors.push({
        field: 'info.teams',
        message: 'Match must have exactly 2 teams',
        severity: 'error',
      });
      result.valid = false;
    }

    // Check: Must have at least 1 innings
    if (innings.length === 0) {
      result.errors.push({
        field: 'innings',
        message: 'Match must have at least 1 innings',
        severity: 'error',
      });
      result.valid = false;
    }

    // Check: Teams in innings must match teams in info
    innings.forEach((inn: any, idx: number) => {
      if (!info.teams.includes(inn.team)) {
        result.errors.push({
          field: `innings[${idx}].team`,
          message: `Team '${inn.team}' not found in match teams`,
          severity: 'error',
        });
        result.valid = false;
      }
    });

    // Warning: Missing player registry
    if (!info.registry || !info.registry.people) {
      result.warnings.push('Player registry missing - may cause issues with player identification');
    }

    // Warning: Missing toss information
    if (!info.toss) {
      result.warnings.push('Toss information missing');
    }

    // Warning: Missing outcome
    if (!info.outcome || !info.outcome.winner) {
      result.warnings.push('Match outcome/winner information missing');
    }

    // Check: Validate ball-by-ball data integrity
    innings.forEach((inn: any, innIdx: number) => {
      let totalRuns = 0;
      let totalWickets = 0;
      let ballCount = 0;

      inn.overs.forEach((over: any, overIdx: number) => {
        over.deliveries.forEach((ball: any, ballIdx: number) => {
          ballCount++;

          // Validate runs add up correctly
          const expectedTotal = ball.runs.batter + ball.runs.extras;
          if (ball.runs.total !== expectedTotal) {
            result.warnings.push(
              `Innings ${innIdx + 1}, Over ${over.over}, Ball ${ballIdx + 1}: ` +
                `Total runs (${ball.runs.total}) doesn't match sum of batter + extras (${expectedTotal})`
            );
          }

          totalRuns += ball.runs.total;

          if (ball.wickets) {
            totalWickets += ball.wickets.length;
          }

          // Check: Runs from batter should be 0-7 typically
          if (ball.runs.batter > 7) {
            result.warnings.push(
              `Innings ${innIdx + 1}, Over ${over.over}, Ball ${ballIdx + 1}: ` +
                `Unusual batter runs: ${ball.runs.batter}`
            );
          }

          // Check: Wickets should not exceed batters available
          if (totalWickets > 10) {
            result.errors.push({
              field: `innings[${innIdx}].overs[${overIdx}].deliveries[${ballIdx}]`,
              message: `More than 10 wickets recorded in innings`,
              severity: 'error',
            });
            result.valid = false;
          }
        });
      });

      // Info: Log total runs and wickets
      result.warnings.push(
        `Innings ${innIdx + 1} (${inn.team}): ${totalRuns} runs, ${totalWickets} wickets in ${ballCount} balls`
      );
    });

    // Check: Date format
    info.dates.forEach((date: string, idx: number) => {
      if (!this.isValidDate(date)) {
        result.warnings.push(`Date ${idx + 1} has unusual format: ${date}`);
      }
    });

    // Check: Overs should be reasonable
    if (info.overs) {
      if (info.match_type.toUpperCase() === 'T20' && info.overs !== 20) {
        result.warnings.push(`T20 match with ${info.overs} overs (expected 20)`);
      }
      if (info.match_type.toUpperCase() === 'ODI' && info.overs !== 50) {
        result.warnings.push(`ODI match with ${info.overs} overs (expected 50)`);
      }
    }
  }

  /**
   * Quick validation check (doesn't parse full data)
   */
  static quickValidate(data: unknown): { valid: boolean; error?: string } {
    try {
      if (typeof data !== 'object' || data === null) {
        return { valid: false, error: 'Data must be an object' };
      }

      const obj = data as any;

      if (!obj.info) {
        return { valid: false, error: 'Missing "info" field' };
      }

      if (!obj.innings) {
        return { valid: false, error: 'Missing "innings" field' };
      }

      if (!Array.isArray(obj.innings)) {
        return { valid: false, error: '"innings" must be an array' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check for duplicate match
   */
  static async checkDuplicate(
    matchId: string,
    existingMatchIds: Set<string>
  ): Promise<{ isDuplicate: boolean; existingId?: string }> {
    if (existingMatchIds.has(matchId)) {
      return {
        isDuplicate: true,
        existingId: matchId,
      };
    }

    return { isDuplicate: false };
  }

  /**
   * Validate date format
   */
  private static isValidDate(dateStr: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  /**
   * Get validation summary
   */
  static getSummary(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push(`Validation Result: ${result.valid ? '✓ VALID' : '✗ INVALID'}`);
    lines.push('');

    if (result.match_info) {
      lines.push('Match Info:');
      lines.push(`  Date: ${result.match_info.date}`);
      lines.push(`  Teams: ${result.match_info.teams.join(' vs ')}`);
      lines.push(`  Venue: ${result.match_info.venue}`);
      lines.push(`  Format: ${result.match_info.format}`);
      lines.push('');
    }

    if (result.errors.length > 0) {
      lines.push(`Errors (${result.errors.length}):`);
      result.errors.forEach((err, idx) => {
        lines.push(`  ${idx + 1}. [${err.field}] ${err.message}`);
      });
      lines.push('');
    }

    if (result.warnings.length > 0) {
      lines.push(`Warnings (${result.warnings.length}):`);
      result.warnings.slice(0, 5).forEach((warn, idx) => {
        lines.push(`  ${idx + 1}. ${warn}`);
      });
      if (result.warnings.length > 5) {
        lines.push(`  ... and ${result.warnings.length - 5} more`);
      }
    }

    return lines.join('\n');
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example usage:
 *
 * const data = CricsheetParser.parseFile(fileContent, 'yaml');
 * const validation = CricsheetValidator.validate(data);
 *
 * if (!validation.valid) {
 *   console.log('Validation failed:');
 *   validation.errors.forEach(err => console.log(`- ${err.message}`));
 * } else {
 *   console.log('Validation passed!');
 *   if (validation.warnings.length > 0) {
 *     console.log('Warnings:', validation.warnings);
 *   }
 * }
 */
