/**
 * Matches API Route
 *
 * GET /api/matches - Get list of matches (with 5-minute cache)
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/lib/services/storage';

// In-memory cache (5 minute TTL)
let matchesCache: { data: any; timestamp: number; key: string } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const startAfter = searchParams.get('startAfter') || undefined;
    const cacheKey = `${limit}-${startAfter || 'none'}`;

    // Check cache first
    if (matchesCache && matchesCache.key === cacheKey && (Date.now() - matchesCache.timestamp) < CACHE_TTL) {
      console.log('✅ Returning cached matches data');
      return NextResponse.json(matchesCache.data);
    }

    console.log(`📊 Fetching matches from database (limit: ${limit})...`);
    const startTime = Date.now();

    const matches = await storageService.getMatches(limit, startAfter);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Fetched ${matches.length} matches in ${duration}s`);

    const responseData = {
      success: true,
      matches,
      count: matches.length,
    };

    // Cache the response
    matchesCache = {
      data: responseData,
      timestamp: Date.now(),
      key: cacheKey,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch matches:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch matches',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
