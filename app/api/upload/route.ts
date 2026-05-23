/**
 * Upload API Route
 *
 * Handles Cricsheet file uploads, parsing, validation, and storage
 * POST /api/upload - Upload and process cricket match file
 */

import { NextRequest, NextResponse } from 'next/server';
import { CricsheetParser } from '@/lib/parser/cricsheet-parser';
import { CricsheetValidator } from '@/lib/parser/validator';
import { storageService } from '@/lib/services/storage';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ============================================================================
// POST /api/upload
// ============================================================================

export async function POST(request: NextRequest) {
  const uploadId = uuidv4();
  let filename = 'unknown';

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    filename = file.name;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          details: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Validate file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!['json', 'yaml', 'yml'].includes(extension || '')) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: 'Only .json, .yaml, or .yml files are accepted',
        },
        { status: 400 }
      );
    }

    // Create upload status
    await storageService.createUploadStatus(uploadId, filename);

    // Read file content
    const content = await file.text();

    // Determine format
    const format = extension === 'json' ? 'json' : 'yaml';

    // Parse file
    let raw;
    try {
      raw = CricsheetParser.parseFile(content, format);
    } catch (error) {
      await storageService.updateUploadStatus(uploadId, {
        status: 'failed',
        error: {
          message: 'Failed to parse file',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        completed_at: new Date(),
      });

      return NextResponse.json(
        {
          error: 'Failed to parse file',
          details: error instanceof Error ? error.message : 'Unknown parsing error',
        },
        { status: 400 }
      );
    }

    // Validate data
    const validation = CricsheetValidator.validate(raw);

    if (!validation.valid) {
      await storageService.updateUploadStatus(uploadId, {
        status: 'failed',
        error: {
          message: 'Validation failed',
          details: validation.errors,
        },
        completed_at: new Date(),
      });

      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    // Extract match data
    const matchInfo = CricsheetParser.extractMatchInfo(raw);
    const deliveries = CricsheetParser.extractDeliveries(raw, matchInfo.match_id);
    const innings = CricsheetParser.calculateInnings(raw, deliveries, matchInfo.match_id);

    // Check for duplicate
    const exists = await storageService.matchExists(matchInfo.match_id);
    if (exists) {
      return NextResponse.json(
        {
          error: 'Match already exists',
          match_id: matchInfo.match_id,
          details: 'This match has already been uploaded',
        },
        { status: 409 }
      );
    }

    // Update status - processing
    await storageService.updateUploadStatus(uploadId, {
      status: 'processing',
      progress: {
        current: 1,
        total: 4,
        stage: 'Saving match data',
      },
    });

    // Save match to Firestore + Firebase Storage
    // Pass the original raw data to preserve all information
    const saveResult = await storageService.saveMatch(matchInfo, deliveries, innings, raw);

    if (!saveResult.success) {
      await storageService.updateUploadStatus(uploadId, {
        status: 'failed',
        error: {
          message: 'Failed to save match',
          details: saveResult.error,
        },
        completed_at: new Date(),
      });

      return NextResponse.json(
        {
          error: 'Failed to save match',
          details: saveResult.error,
        },
        { status: 500 }
      );
    }

    // OPTIMIZATION: Skip player/team/venue stats updates during bulk uploads
    // These can be calculated later in batch jobs for better performance
    //
    // Each match was updating 30-40 individual documents, causing:
    // - Slow uploads (30s → 2+ minutes)
    // - Uploads getting stuck in "processing"
    // - Firestore throttling
    //
    // Stats updates are now DISABLED for fast bulk uploads
    // You can re-enable by uncommenting the code below

    let playersUpdated = 0;

    // UNCOMMENT TO ENABLE STATS (WARNING: Will slow down uploads significantly)
    /*
    await storageService.updateUploadStatus(uploadId, {
      progress: {
        current: 2,
        total: 4,
        stage: 'Updating player statistics',
      },
    });

    for (const inn of innings) {
      // Update batter stats
      for (const batter of inn.batters) {
        const playerId =
          matchInfo.registry?.people[batter.player] ||
          batter.player.toLowerCase().replace(/\s+/g, '_');

        await storageService.updatePlayerStats(
          playerId,
          batter.player,
          matchInfo,
          batter,
          undefined
        );
        playersUpdated++;
      }

      // Update bowler stats
      for (const bowler of inn.bowlers) {
        const playerId =
          matchInfo.registry?.people[bowler.player] ||
          bowler.player.toLowerCase().replace(/\s+/g, '_');

        await storageService.updatePlayerStats(
          playerId,
          bowler.player,
          matchInfo,
          undefined,
          bowler
        );
        playersUpdated++;
      }
    }

    await storageService.updateUploadStatus(uploadId, {
      progress: {
        current: 3,
        total: 4,
        stage: 'Updating team statistics',
      },
    });

    await storageService.updateTeamStats(matchInfo);

    await storageService.updateUploadStatus(uploadId, {
      progress: {
        current: 4,
        total: 4,
        stage: 'Updating venue statistics',
      },
    });

    await storageService.updateVenueStats(matchInfo, innings);
    */

    // Mark as completed
    await storageService.updateUploadStatus(uploadId, {
      status: 'completed',
      result: {
        match_id: matchInfo.match_id,
        deliveries_processed: deliveries.length,
        players_updated: playersUpdated,
        warnings: validation.warnings,
      },
      completed_at: new Date(),
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        upload_id: uploadId,
        match_id: matchInfo.match_id,
        match_info: validation.match_info,
        stats: {
          deliveries: deliveries.length,
          innings: innings.length,
          players_updated: playersUpdated,
        },
        warnings: validation.warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload error:', error);

    // Update status to failed
    try {
      await storageService.updateUploadStatus(uploadId, {
        status: 'failed',
        error: {
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        completed_at: new Date(),
      });
    } catch (statusError) {
      console.error('Failed to update upload status:', statusError);
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/upload?limit=20
// Get recent uploads
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const uploads = await storageService.getRecentUploads(limit);

    return NextResponse.json({
      success: true,
      uploads,
    });
  } catch (error) {
    console.error('Failed to fetch uploads:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch uploads',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
