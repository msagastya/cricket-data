/**
 * Storage Diagnostic Test
 * Check if Firestore is accessible and has write capacity
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

// Initialize Firebase Admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in environment');
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountKey, 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

async function runDiagnostics() {
  console.log('\n🔍 Running Storage Diagnostics...\n');

  try {
    // Test 1: Check connection
    console.log('1️⃣  Testing Firestore connection...');
    const testRef = db.collection('_test').doc('connection');
    await testRef.set({ timestamp: new Date(), test: true });
    await testRef.delete();
    console.log('   ✅ Connection successful\n');

    // Test 2: Count existing matches
    console.log('2️⃣  Counting existing matches...');
    const matchesSnapshot = await db.collection('matches').count().get();
    const matchCount = matchesSnapshot.data().count;
    console.log(`   📊 Total matches in database: ${matchCount}\n`);

    // Test 3: Count players
    console.log('3️⃣  Counting players...');
    const playersSnapshot = await db.collection('players').count().get();
    const playerCount = playersSnapshot.data().count;
    console.log(`   👤 Total players in database: ${playerCount}\n`);

    // Test 4: Test write performance
    console.log('4️⃣  Testing write performance...');
    const start = Date.now();
    const testWrites = [];
    for (let i = 0; i < 10; i++) {
      testWrites.push(
        db.collection('_test').doc(`test_${i}`).set({
          index: i,
          timestamp: new Date(),
        })
      );
    }
    await Promise.all(testWrites);
    const elapsed = Date.now() - start;
    console.log(`   ⏱️  10 writes completed in ${elapsed}ms (${(elapsed / 10).toFixed(1)}ms per write)\n`);

    // Clean up test writes
    const batch = db.batch();
    for (let i = 0; i < 10; i++) {
      batch.delete(db.collection('_test').doc(`test_${i}`));
    }
    await batch.commit();

    // Test 5: Check recent uploads
    console.log('5️⃣  Checking recent uploads...');
    const uploadsSnapshot = await db
      .collection('upload_status')
      .orderBy('created_at', 'desc')
      .limit(5)
      .get();

    if (uploadsSnapshot.empty) {
      console.log('   ⚠️  No recent uploads found\n');
    } else {
      console.log('   📝 Recent uploads:');
      uploadsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`      - ${data.filename}: ${data.status}`);
      });
      console.log();
    }

    console.log('✅ All diagnostics passed!\n');
    console.log('🔍 Storage Summary:');
    console.log(`   - Matches: ${matchCount}`);
    console.log(`   - Players: ${playerCount}`);
    console.log(`   - Write speed: ${(elapsed / 10).toFixed(1)}ms per write`);
    console.log(`   - Connection: Healthy`);

    if (elapsed / 10 > 500) {
      console.log('\n⚠️  WARNING: Writes are slow (>500ms each)');
      console.log('   This could indicate:');
      console.log('   - Network latency');
      console.log('   - Firestore throttling');
      console.log('   - Database index issues');
    }

  } catch (error) {
    console.error('\n❌ Diagnostic failed:', error);
    console.error('\nPossible causes:');
    console.error('   - Firestore quota exceeded');
    console.error('   - Network connection issues');
    console.error('   - Invalid credentials');
    console.error('   - Firestore rules blocking writes');
  }

  process.exit(0);
}

runDiagnostics();
