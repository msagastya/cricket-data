/**
 * Delete ALL matches from Firestore
 * Clean slate for new optimized uploads
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

async function deleteAllMatches() {
  console.log('\n🗑️  DELETING ALL MATCHES FROM FIRESTORE\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get all matches
  const matchesSnapshot = await db.collection('matches').get();
  const totalMatches = matchesSnapshot.size;

  console.log(`Found ${totalMatches} matches to delete\n`);

  if (totalMatches === 0) {
    console.log('✅ No matches to delete. Database is already clean.\n');
    process.exit(0);
  }

  // Confirm deletion
  console.log('⚠️  WARNING: This will permanently delete all match data!\n');
  console.log('Starting deletion in 3 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  let deleted = 0;
  let errors = 0;

  for (const matchDoc of matchesSnapshot.docs) {
    try {
      const matchId = matchDoc.id;
      const matchRef = matchDoc.ref;

      console.log(`  ${deleted + 1}/${totalMatches} Deleting: ${matchId}`);

      // Delete data subcollection
      const dataSnapshot = await matchRef.collection('data').get();
      if (dataSnapshot.size > 0) {
        const batch = db.batch();
        dataSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Delete old structure if exists (innings, deliveries, partnerships subcollections)
      const oldInnings = await matchRef.collection('innings').get();
      if (oldInnings.size > 0) {
        const batch = db.batch();
        oldInnings.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      const oldDeliveries = await matchRef.collection('deliveries').get();
      if (oldDeliveries.size > 0) {
        // Delete in batches of 500 (Firestore limit)
        for (let i = 0; i < oldDeliveries.docs.length; i += 500) {
          const batch = db.batch();
          oldDeliveries.docs.slice(i, i + 500).forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }

      const oldPartnerships = await matchRef.collection('partnerships').get();
      if (oldPartnerships.size > 0) {
        const batch = db.batch();
        oldPartnerships.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Delete main match document
      await matchRef.delete();

      deleted++;
      console.log(`     ✅ Deleted (${deleted}/${totalMatches})`);
    } catch (error) {
      console.error(`     ❌ Error deleting ${matchDoc.id}:`, error.message);
      errors++;
    }
  }

  // Delete upload status documents
  console.log('\n📋 Cleaning upload status...');
  const uploadsSnapshot = await db.collection('uploads').get();
  if (uploadsSnapshot.size > 0) {
    const batch = db.batch();
    uploadsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`   ✅ Deleted ${uploadsSnapshot.size} upload records`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('📊 DELETION SUMMARY:\n');
  console.log(`   ✅ Successfully deleted: ${deleted} matches`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📋 Upload records cleaned: ${uploadsSnapshot.size}\n`);

  if (errors === 0) {
    console.log('✅ Database is now completely clean!\n');
    console.log('Ready for fresh uploads with optimized architecture.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some errors occurred during deletion.\n');
    process.exit(1);
  }
}

deleteAllMatches().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
