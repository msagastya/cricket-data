/**
 * Export all matches from Firestore to JSON files
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

async function exportMatches() {
  console.log('\n📥 EXPORTING MATCHES FROM FIRESTORE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create export directory
  const exportDir = path.join(__dirname, 'exported_matches');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }

  console.log(`📂 Export directory: ${exportDir}\n`);

  // Get all matches
  const matchesSnapshot = await db.collection('matches').get();
  console.log(`Found ${matchesSnapshot.size} matches\n`);

  let exported = 0;

  for (const matchDoc of matchesSnapshot.docs) {
    try {
      const matchData = matchDoc.data();
      const matchId = matchDoc.id;

      console.log(`  ${exported + 1}. Exporting: ${matchId}`);

      // Get subcollections
      const innings = await matchDoc.ref.collection('innings').get();
      const deliveries = await matchDoc.ref.collection('deliveries').get();
      const partnerships = await matchDoc.ref.collection('partnerships').get();

      // Build complete match data
      const fullMatch = {
        match_id: matchId,
        info: matchData,
        innings: innings.docs.map(doc => doc.data()),
        deliveries: deliveries.docs.map(doc => doc.data()),
        partnerships: partnerships.docs.map(doc => doc.data()),
      };

      // Save to file
      const filename = `${matchId}.json`;
      const filepath = path.join(exportDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(fullMatch, null, 2));

      console.log(`     ✅ Saved to: ${filename}`);
      exported++;
    } catch (error) {
      console.error(`     ❌ Error exporting ${matchDoc.id}:`, error.message);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Export complete: ${exported} matches exported\n`);
  console.log(`📂 Location: ${exportDir}\n`);

  process.exit(0);
}

exportMatches().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
