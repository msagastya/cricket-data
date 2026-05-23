/**
 * Test File Upload - Diagnose why a file is being rejected
 * Usage: node test-file-upload.js <path-to-file>
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

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

function generateMatchId(info) {
  const format = info.match_type?.toLowerCase() || 'unknown';
  const team1 = info.teams?.[0]?.toLowerCase().replace(/\s+/g, '_') || 'team1';
  const team2 = info.teams?.[1]?.toLowerCase().replace(/\s+/g, '_') || 'team2';
  const date = info.dates?.[0] ? new Date(info.dates[0]).toISOString().split('T')[0].replace(/-/g, '') : 'unknown';
  const venue = info.venue?.toLowerCase().replace(/\s+/g, '_').substring(0, 30) || 'unknown';
  return `${format}_${team1}_vs_${team2}_${date}_${venue}`;
}

async function testFile(filePath) {
  console.log('\n🔍 TESTING FILE UPLOAD\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!filePath) {
    console.error('❌ Usage: node test-file-upload.js <path-to-file>');
    console.error('   Example: node test-file-upload.js /path/to/match.json\n');
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}\n`);
    process.exit(1);
  }

  console.log(`📄 File: ${path.basename(fullPath)}`);
  console.log(`📂 Path: ${fullPath}`);

  const stats = fs.statSync(fullPath);
  console.log(`📏 Size: ${(stats.size / 1024).toFixed(2)} KB\n`);

  // Read file
  console.log('1️⃣  Reading file...');
  const content = fs.readFileSync(fullPath, 'utf8');
  console.log('   ✅ File read successfully\n');

  // Determine format
  const ext = path.extname(fullPath).toLowerCase();
  const format = ext === '.json' ? 'json' : 'yaml';
  console.log(`2️⃣  Format: ${format.toUpperCase()}`);

  // Parse file
  console.log('3️⃣  Parsing file...');
  let data;
  try {
    if (format === 'json') {
      data = JSON.parse(content);
    } else {
      data = yaml.load(content);
    }
    console.log('   ✅ File parsed successfully\n');
  } catch (error) {
    console.error('   ❌ PARSING FAILED!');
    console.error(`   Error: ${error.message}\n`);
    console.error('   This file will be rejected with status 400\n');
    process.exit(1);
  }

  // Extract match info
  console.log('4️⃣  Extracting match information...');
  const info = data.info;

  if (!info) {
    console.error('   ❌ No "info" section found in file');
    console.error('   This file will be rejected with status 400\n');
    process.exit(1);
  }

  console.log(`   Teams: ${info.teams?.join(' vs ') || 'Unknown'}`);
  console.log(`   Venue: ${info.venue || 'Unknown'}`);
  console.log(`   Date: ${info.dates?.[0] || 'Unknown'}`);
  console.log(`   Format: ${info.match_type || 'Unknown'}\n`);

  // Generate match ID
  console.log('5️⃣  Generating match ID...');
  const matchId = generateMatchId(info);
  console.log(`   Match ID: ${matchId}\n`);

  // Check if exists in database
  console.log('6️⃣  Checking for duplicates...');
  const matchDoc = await db.collection('matches').doc(matchId).get();

  if (matchDoc.exists) {
    console.error('   ❌ DUPLICATE FOUND!');
    console.error('   This match already exists in the database');
    console.error('   Upload will be rejected with status 409\n');

    const existingData = matchDoc.data();
    console.log('   Existing match details:');
    console.log(`   - Teams: ${existingData.teams?.join(' vs ')}`);
    console.log(`   - Venue: ${existingData.venue}`);
    console.log(`   - Date: ${existingData.dates?.[0]}`);
    console.log(`   - Uploaded: ${existingData.created_at?.toDate?.()?.toLocaleString() || 'Unknown'}\n`);

    console.log('   💡 To upload this file:');
    console.log('      1. Delete the existing match from /matches page');
    console.log('      2. Or upload a different match file\n');

    process.exit(0);
  }

  console.log('   ✅ No duplicate found - this is a NEW match!\n');

  // Check for deliveries
  console.log('7️⃣  Checking match data...');
  const innings = data.innings;
  if (!innings || innings.length === 0) {
    console.error('   ❌ No innings data found');
    console.error('   This file will be rejected with status 400\n');
    process.exit(1);
  }

  let totalDeliveries = 0;
  innings.forEach((inn, i) => {
    const overs = inn.overs || [];
    overs.forEach(over => {
      totalDeliveries += (over.deliveries || []).length;
    });
  });

  console.log(`   Innings: ${innings.length}`);
  console.log(`   Deliveries: ${totalDeliveries}\n`);

  if (totalDeliveries === 0) {
    console.error('   ⚠️  WARNING: No deliveries found in innings');
    console.error('   This file might be rejected\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('✅ FILE VALIDATION PASSED!');
  console.log('\n   This file SHOULD upload successfully!');
  console.log('   Expected status: 201 (Created)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

const filePath = process.argv[2];
testFile(filePath).catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
