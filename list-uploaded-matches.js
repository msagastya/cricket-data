/**
 * List all matches already in Firebase
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

async function listMatches() {
  console.log('\n📊 MATCHES ALREADY IN YOUR DATABASE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  const matchesSnapshot = await db.collection('matches')
    .orderBy('dates', 'desc')
    .get();

  console.log(`Total matches: ${matchesSnapshot.size}\n`);

  matchesSnapshot.docs.forEach((doc, i) => {
    const data = doc.data();
    const date = data.dates?.[0] ? new Date(data.dates[0]).toISOString().split('T')[0] : 'Unknown';
    console.log(`${i + 1}. ${data.teams?.join(' vs ') || 'Unknown'}`);
    console.log(`   Date: ${date} | Venue: ${data.venue} | Format: ${data.match_type}`);
    console.log(`   Match ID: ${doc.id}`);
    console.log();
  });

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('💡 If you try to upload any of these matches again, you will get:');
  console.log('   "POST /api/upload 409" = Duplicate (already exists)\n');
  console.log('✅ To upload NEW matches, make sure the file is NOT in the list above!\n');

  process.exit(0);
}

listMatches().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
