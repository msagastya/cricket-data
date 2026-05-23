/**
 * Bulk Upload Script
 * Uploads all cricket match JSON files to the API
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_URL = 'http://localhost:204/api/upload';

// ALL FORMATS (7,585 matches - IPL, T20I, ODI, Test)
const DATA_DIR = '/Users/msagastya/Downloads/cricsheet_data';

// Or use original World Cup ODI only (265 matches)
// const DATA_DIR = '/Users/msagastya/Downloads/icc_mens_cricket_world_cup_male_json';

const CONCURRENT_UPLOADS = 10; // Increased from 5 for faster uploads

function uploadFile(filePath, fileName) {
  try {
    const command = `curl -s -X POST "${API_URL}" -F "file=@${filePath}" -m 60`;
    const output = execSync(command, { encoding: 'utf-8' });
    const data = JSON.parse(output);

    return {
      success: data.success || false,
      fileName,
      data,
    };
  } catch (error) {
    return {
      success: false,
      fileName,
      error: error.message,
    };
  }
}

async function bulkUpload() {
  console.log('\n🚀 BULK UPLOAD STARTED\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Get all JSON files
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(DATA_DIR, f),
    }));

  console.log(`📁 Found ${files.length} JSON files to upload\n`);

  const results = {
    total: files.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const startTime = Date.now();

  // Process files one by one for now (can be batched later)
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileNum = i + 1;

    process.stdout.write(`  ${fileNum}/${files.length} ${file.name}...`);

    const result = uploadFile(file.path, file.name);

    if (result.success) {
      results.successful++;
      const matchId = result.data.match_id || 'unknown';
      const deliveries = result.data.stats?.deliveries || 0;
      console.log(` ✅`);
      console.log(`     Match: ${matchId.substring(0, 60)}`);
      console.log(`     Deliveries: ${deliveries}, Writes: 3`);
    } else {
      // Check both result.error (from catch block) and result.data.error (from API response)
      const error = result.error || result.data?.error || result.data?.details || 'Unknown error';
      const errorMsg = typeof error === 'string' ? error : error?.message || JSON.stringify(error);

      if (errorMsg && errorMsg.toLowerCase().includes('already exists')) {
        results.skipped++;
        console.log(` ⏭️  Already exists`);
      } else {
        results.failed++;
        console.log(` ❌`);
        console.log(`     Error: ${errorMsg.substring(0, 100)}`);
        results.errors.push({ fileName: file.name, error: errorMsg });
      }
    }

    // Show progress every 10 files
    if (fileNum % 10 === 0 || fileNum === files.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (fileNum / elapsed).toFixed(2);
      console.log(`\n  📊 Progress: ${fileNum}/${files.length} | ${rate} files/sec | ${elapsed}s elapsed\n`);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const avgTimePerFile = (duration / files.length).toFixed(2);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📊 UPLOAD SUMMARY\n');
  console.log(`   Total files:        ${results.total}`);
  console.log(`   ✅ Successful:      ${results.successful}`);
  console.log(`   ⏭️  Skipped:         ${results.skipped}`);
  console.log(`   ❌ Failed:          ${results.failed}`);
  console.log(`\n   ⏱️  Total time:      ${duration}s`);
  console.log(`   ⚡ Avg per file:    ${avgTimePerFile}s`);
  console.log(`   💾 Total writes:    ${results.successful * 3} (optimized)\n`);

  if (results.errors.length > 0 && results.errors.length <= 10) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n⚠️  ERRORS DETAIL\n');
    results.errors.forEach((err, idx) => {
      console.log(`${idx + 1}. ${err.fileName}`);
      console.log(`   ${err.error.substring(0, 200)}\n`);
    });
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  if (results.failed === 0) {
    console.log('✅ All uploads completed successfully!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${results.failed} uploads failed. Check errors above.\n`);
    process.exit(1);
  }
}

// Run bulk upload
bulkUpload().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
