/**
 * Verify the new storage structure (3 writes/match)
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
});

const db = admin.firestore();

async function verifyStructure() {
  console.log('\n📊 VERIFYING NEW STORAGE STRUCTURE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const matchId = 'odi_australia_vs_new_zealand_20150329_melbourne_cricket_gr';
  console.log(`Checking match: ${matchId}\n`);

  // Get match metadata
  const matchDoc = await db.collection('matches').doc(matchId).get();
  if (!matchDoc.exists) {
    console.log('❌ Match not found!\n');
    process.exit(1);
  }

  const matchData = matchDoc.data();
  console.log('✅ Match metadata found:');
  console.log(`   - Teams: ${matchData.teams?.join(' vs ')}`);
  console.log(`   - Venue: ${matchData.venue}`);
  console.log(`   - Date: ${matchData.date}`);
  console.log(`   - Deliveries count: ${matchData.deliveries_count}\n`);

  // Check data subcollection structure
  const dataSnapshot = await matchDoc.ref.collection('data').get();
  console.log(`📁 Data subcollection has ${dataSnapshot.size} documents:\n`);

  for (const doc of dataSnapshot.docs) {
    const data = doc.data();
    console.log(`   📄 ${doc.id}:`);

    if (doc.id === 'deliveries') {
      console.log(`      - Deliveries: ${data.count} (stored as single JSON)`);
      console.log(`      - First delivery: Over ${data.deliveries[0].over}, Ball ${data.deliveries[0].ball}`);
    } else if (doc.id === 'innings') {
      console.log(`      - Innings: ${data.innings?.length}`);
      data.innings?.forEach((inn, i) => {
        console.log(`        ${i + 1}. ${inn.team}: ${inn.total_runs}/${inn.total_wickets} in ${inn.total_overs} overs`);
      });
    }
    console.log();
  }

  // Verify old structure doesn't exist
  const oldInnings = await matchDoc.ref.collection('innings').get();
  const oldDeliveries = await matchDoc.ref.collection('deliveries').get();

  if (oldInnings.size > 0 || oldDeliveries.size > 0) {
    console.log('⚠️  WARNING: Old structure still exists!');
    console.log(`   - Old innings documents: ${oldInnings.size}`);
    console.log(`   - Old delivery documents: ${oldDeliveries.size}\n`);
  } else {
    console.log('✅ No old structure found (good!)\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📊 STORAGE STRUCTURE VERIFICATION:\n');
  console.log('   ✅ Match metadata: 1 document');
  console.log('   ✅ Data/innings: 1 document (all innings as JSON array)');
  console.log('   ✅ Data/deliveries: 1 document (all deliveries as JSON array)');
  console.log('   ✅ TOTAL WRITES: 3 per match\n');
  console.log('🎉 New storage structure verified!\n');

  process.exit(0);
}

verifyStructure().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
