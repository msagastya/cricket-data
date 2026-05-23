/**
 * Batch Upload Script (Free Tier Friendly)
 * Uploads matches in daily batches to stay within Firebase free tier limits
 *
 * Free tier limit: 20,000 writes/day
 * Each match uses ~3 writes
 * Safe limit: 6,500 matches/day
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const API_URL = 'http://localhost:204/api/upload';
const DATA_DIR = '/Users/msagastya/Downloads/cricsheet_data';
const BATCH_SIZE = 6500; // Matches per day (safe for free tier)

// State file to track progress
const STATE_FILE = path.join(__dirname, 'upload-progress.json');

function loadProgress() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return { uploadedFiles: [], lastBatch: 0 };
}

function saveProgress(progress) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(progress, null, 2));
}

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

async function batchUpload() {
  console.log('\n🚀 BATCH UPLOAD (FREE TIER FRIENDLY)\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Load progress
  const progress = loadProgress();
  console.log(`📋 Previous progress: ${progress.uploadedFiles.length} files already uploaded\n`);

  // Get all JSON files
  const allFiles = fs.readdirSync(DATA_DIR)
    .filter(file => file.endsWith('.json'))
    .map(file => ({
      name: file,
      path: path.join(DATA_DIR, file),
    }));

  // Filter out already uploaded files
  const remainingFiles = allFiles.filter(
    file => !progress.uploadedFiles.includes(file.name)
  );

  if (remainingFiles.length === 0) {
    console.log('✅ All files already uploaded!\n');
    return;
  }

  // Get today's batch
  const todaysBatch = remainingFiles.slice(0, BATCH_SIZE);
  const batchNumber = progress.lastBatch + 1;

  console.log(`📦 Batch ${batchNumber} Details:`);
  console.log(`   Total files: ${allFiles.length}`);
  console.log(`   Already uploaded: ${progress.uploadedFiles.length}`);
  console.log(`   Remaining: ${remainingFiles.length}`);
  console.log(`   Uploading today: ${todaysBatch.length}`);
  console.log(`   After today: ${remainingFiles.length - todaysBatch.length} will remain\n`);

  const results = {
    successful: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const startTime = Date.now();

  // Process files
  for (let i = 0; i < todaysBatch.length; i++) {
    const file = todaysBatch[i];
    const fileNum = i + 1;

    process.stdout.write(`  ${fileNum}/${todaysBatch.length} ${file.name}...`);

    const result = uploadFile(file.path, file.name);

    if (result.success) {
      results.successful++;
      progress.uploadedFiles.push(file.name);
      console.log(` ✅`);
    } else {
      const error = result.error || result.data?.error || result.data?.details || 'Unknown error';
      const errorMsg = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));

      if (errorMsg && errorMsg.toLowerCase().includes('already exists')) {
        results.skipped++;
        progress.uploadedFiles.push(file.name);
        console.log(` ⏭️  Already exists`);
      } else {
        results.failed++;
        console.log(` ❌`);
        const errMsg = errorMsg.length > 100 ? errorMsg.slice(0, 100) : errorMsg;
        console.log(`     Error: ${errMsg}`);
        results.errors.push({ fileName: file.name, error: errorMsg });
      }
    }

    // Show progress every 100 files
    if (fileNum % 100 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (fileNum / elapsed).toFixed(2);
      console.log(`\n  📊 Progress: ${fileNum}/${todaysBatch.length} | ${rate} files/sec\n`);
    }
  }

  // Save progress
  progress.lastBatch = batchNumber;
  saveProgress(progress);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('\n📊 BATCH UPLOAD SUMMARY\n');
  console.log(`   Batch number:       ${batchNumber}`);
  console.log(`   ✅ Successful:      ${results.successful}`);
  console.log(`   ⏭️  Skipped:         ${results.skipped}`);
  console.log(`   ❌ Failed:          ${results.failed}`);
  console.log(`   ⏱️  Duration:        ${duration}s`);
  console.log(`   📁 Total uploaded:  ${progress.uploadedFiles.length}/${allFiles.length}`);
  console.log(`   📋 Remaining:       ${allFiles.length - progress.uploadedFiles.length}`);

  if (results.failed > 0) {
    console.log(`\n❌ Failed files:`);
    results.errors.forEach(err => {
      const errMsg = err.error.length > 60 ? err.error.slice(0, 60) : err.error;
      console.log(`   - ${err.fileName}: ${errMsg}`);
    });
  }

  const remaining = allFiles.length - progress.uploadedFiles.length;
  if (remaining > 0) {
    const daysRemaining = Math.ceil(remaining / BATCH_SIZE);
    console.log(`\n📅 Next steps:`);
    console.log(`   Run this script again tomorrow to upload next batch`);
    console.log(`   Estimated days remaining: ${daysRemaining}`);
  } else {
    console.log(`\n🎉 All files uploaded! You can delete upload-progress.json`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

batchUpload().catch(console.error);
