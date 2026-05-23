/**
 * Match API Routes
 *
 * GET /api/matches/[id] - Get match details (with 10-minute cache)
 * DELETE /api/matches/[id] - Delete match
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

// In-memory cache for individual match details (10-minute TTL)
const matchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const matchId = resolvedParams.id;

    // Check cache first
    const cached = matchCache.get(matchId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`✅ Returning cached match data for ${matchId}`);
      return NextResponse.json(cached.data);
    }

    console.log(`📊 Fetching match ${matchId} from database...`);
    const startTime = Date.now();

    const db = getAdminFirestore();
    const matchDoc = await db.collection('matches').doc(matchId).get();

    if (!matchDoc.exists) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    const matchData = matchDoc.data();

    // Get full match data from data subcollection
    const inningsDoc = await matchDoc.ref.collection('data').doc('innings').get();
    const deliveriesDoc = await matchDoc.ref.collection('data').doc('deliveries').get();

    const innings = inningsDoc.exists ? inningsDoc.data()?.innings : [];
    const deliveries = deliveriesDoc.exists ? deliveriesDoc.data()?.deliveries : [];

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Fetched match ${matchId} in ${duration}s`);

    const responseData = {
      success: true,
      match: matchData,
      innings: innings,
      deliveries: deliveries,
    };

    // Cache the response
    matchCache.set(matchId, {
      data: responseData,
      timestamp: Date.now(),
    });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Failed to fetch match:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch match',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const matchId = resolvedParams.id;
    const db = getAdminFirestore();
    const matchRef = db.collection('matches').doc(matchId);

    // Clear cache for this match
    matchCache.delete(matchId);

    // Check if match exists
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Delete subcollections in batches (Firestore limit: 500 per batch)
    const deleteBatch = async (docs: any[]) => {
      const batch = db.batch();
      docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    };

    // Delete deliveries
    const deliveries = await matchRef.collection('deliveries').get();
    const deliveryBatches = [];
    for (let i = 0; i < deliveries.docs.length; i += 500) {
      deliveryBatches.push(deliveries.docs.slice(i, i + 500));
    }
    for (const batch of deliveryBatches) {
      await deleteBatch(batch);
    }

    // Delete innings
    const innings = await matchRef.collection('innings').get();
    if (innings.docs.length > 0) {
      await deleteBatch(innings.docs);
    }

    // Delete partnerships
    const partnerships = await matchRef.collection('partnerships').get();
    if (partnerships.docs.length > 0) {
      await deleteBatch(partnerships.docs);
    }

    // Delete main match document
    await matchRef.delete();

    console.log(`✅ Match deleted: ${matchId}`);

    return NextResponse.json({
      success: true,
      message: 'Match deleted successfully',
      match_id: matchId,
    });
  } catch (error) {
    console.error('Failed to delete match:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete match',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
