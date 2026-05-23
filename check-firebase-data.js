/**
 * Check Firebase/Firestore Data
 * Shows what data is actually stored in your database
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        process.env[key.trim()] = value.slice(1, -1);
      } else {
        process.env[key.trim()] = value;
      }
    }
  });
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

async function checkData() {
  console.log('\n🔥 FIREBASE/FIRESTORE DATA STRUCTURE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // 1. Matches Collection
  console.log('📊 MATCHES COLLECTION (Main match data)');
  const matchesSnapshot = await db.collection('matches').limit(3).get();
  console.log(`   Total matches: ${(await db.collection('matches').count().get()).data().count}`);

  if (!matchesSnapshot.empty) {
    const firstMatch = matchesSnapshot.docs[0];
    const matchData = firstMatch.data();
    console.log(`\n   Example match: ${firstMatch.id}`);
    console.log(`   - Teams: ${matchData.teams?.join(' vs ')}`);
    console.log(`   - Venue: ${matchData.venue}`);
    console.log(`   - Date: ${matchData.dates?.[0]}`);
    console.log(`   - Format: ${matchData.match_type}`);

    // Check subcollections
    const deliveriesCount = (await firstMatch.ref.collection('deliveries').count().get()).data().count;
    const inningsCount = (await firstMatch.ref.collection('innings').count().get()).data().count;
    const partnershipsCount = (await firstMatch.ref.collection('partnerships').count().get()).data().count;

    console.log(`\n   Subcollections for this match:`);
    console.log(`   - deliveries: ${deliveriesCount} documents (ball-by-ball data)`);
    console.log(`   - innings: ${inningsCount} documents (innings summaries)`);
    console.log(`   - partnerships: ${partnershipsCount} documents (partnerships)`);
  }

  console.log('\n───────────────────────────────────────────────────────────\n');

  // 2. Players Collection
  console.log('👤 PLAYERS COLLECTION (Player statistics)');
  const playersCount = (await db.collection('players').count().get()).data().count;
  console.log(`   Total players: ${playersCount}`);

  if (playersCount > 0) {
    const playersSnapshot = await db.collection('players').limit(1).get();
    if (!playersSnapshot.empty) {
      const player = playersSnapshot.docs[0].data();
      console.log(`\n   Example: ${player.name}`);
      console.log(`   - Total matches: ${player.total_matches || 0}`);
      console.log(`   - Career stats: ${Object.keys(player.career_stats || {}).join(', ') || 'None yet'}`);
    }
  } else {
    console.log('   ⚠️  No player stats (stats updates are currently disabled)');
  }

  console.log('\n───────────────────────────────────────────────────────────\n');

  // 3. Teams Collection
  console.log('🏏 TEAMS COLLECTION (Team records)');
  const teamsCount = (await db.collection('teams').count().get()).data().count;
  console.log(`   Total teams: ${teamsCount}`);

  if (teamsCount > 0) {
    const teamsSnapshot = await db.collection('teams').limit(1).get();
    if (!teamsSnapshot.empty) {
      const team = teamsSnapshot.docs[0].data();
      console.log(`\n   Example: ${team.name}`);
      console.log(`   - Records: ${Object.keys(team.record || {}).join(', ') || 'None'}`);
    }
  } else {
    console.log('   ⚠️  No team stats (stats updates are currently disabled)');
  }

  console.log('\n───────────────────────────────────────────────────────────\n');

  // 4. Upload Status
  console.log('📤 UPLOAD_STATUS COLLECTION (Upload history)');
  const uploadsSnapshot = await db.collection('upload_status').orderBy('created_at', 'desc').limit(5).get();
  console.log(`   Recent uploads (last 5):\n`);

  uploadsSnapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    console.log(`   ${i + 1}. ${data.filename}`);
    console.log(`      Status: ${data.status}`);
    console.log(`      Created: ${data.created_at?.toDate?.()?.toLocaleString() || 'Unknown'}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Summary
  const totalMatches = (await db.collection('matches').count().get()).data().count;
  const totalPlayers = (await db.collection('players').count().get()).data().count;
  const totalTeams = (await db.collection('teams').count().get()).data().count;

  console.log('📈 SUMMARY:');
  console.log(`   ✅ ${totalMatches} matches stored in Firebase`);
  console.log(`   ✅ ${totalPlayers} players registered`);
  console.log(`   ✅ ${totalTeams} teams registered`);
  console.log(`\n   🔗 View in Firebase Console:`);
  console.log(`   https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore`);
  console.log('\n═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

checkData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
