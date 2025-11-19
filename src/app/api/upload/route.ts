import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

// Define a simplified interface for the incoming Cricsheet JSON for validation
interface CricsheetData {
  meta: object;
  info: object;
  innings: object[];
}

export async function POST(request: Request) {
  try {
    // 1. Verify Authentication
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 2. (Optional but Recommended) Verify Admin Custom Claim
    // if (decodedToken.isAdmin !== true) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // 3. Parse and Validate Body
    const { jsonData, matchId } = await request.json();

    if (!jsonData || !matchId || typeof matchId !== 'string') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Basic validation of the Cricsheet data structure
    if (!jsonData.meta || !jsonData.info || !jsonData.innings) {
        return NextResponse.json({ error: 'Invalid Cricsheet JSON structure' }, { status: 400 });
    }

    // 4. Write to Firestore
    const db = admin.firestore();
    const matchRef = db.collection('matches').doc(matchId);
    
    // Here you would transform the jsonData to your desired Firestore schema
    // For now, we'll save the transformed data (or raw data for simplicity)
    // A real implementation should have a robust transformation step.
    await matchRef.set(jsonData, { merge: true });

    return NextResponse.json({
      status: 'success',
      message: `Match ${matchId} data uploaded successfully.`,
    });

  } catch (error: any) {
    console.error('Upload failed:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Token expired, please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
