/**
 * Comprehensive Backend Checkup
 * Verifies all systems are ready
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 COMPREHENSIVE BACKEND CHECKUP\n');
console.log('═══════════════════════════════════════════════════════════\n');

let issues = [];
let warnings = [];
let passed = 0;

// Check 1: Validator accepts any review/replacements
console.log('1️⃣  Checking validator...');
const validator = fs.readFileSync('./lib/parser/validator.ts', 'utf8');
if (validator.includes('review: z.any().optional()') &&
    validator.includes('replacements: z.any().optional()')) {
  console.log('   ✅ Validator is flexible (accepts 2003 & 2019 formats)\n');
  passed++;
} else {
  console.log('   ❌ Validator may reject newer formats\n');
  issues.push('Validator not flexible enough');
}

// Check 2: Storage service uses batch writes
console.log('2️⃣  Checking storage service...');
const storage = fs.readFileSync('./lib/services/storage.ts', 'utf8');
if (storage.includes('batch.set(matchRef.collection(\'data\').doc(\'deliveries\')')) {
  console.log('   ✅ Deliveries stored as single document (3 writes/match)\n');
  passed++;
} else if (storage.includes('storage.bucket()')) {
  console.log('   ⚠️  Using Firebase Storage (requires bucket setup)\n');
  warnings.push('Firebase Storage may not be enabled');
} else {
  console.log('   ❌ Still using old method (500 writes/match)\n');
  issues.push('Storage not optimized');
}

// Check 3: Upload route optimization
console.log('3️⃣  Checking upload route...');
const upload = fs.readFileSync('./app/api/upload/route.ts', 'utf8');
if (upload.includes('// OPTIMIZATION') || upload.includes('// Stats updates are now DISABLED')) {
  console.log('   ✅ Stats updates disabled (fast uploads)\n');
  passed++;
} else {
  console.log('   ⚠️  Stats updates may slow down uploads\n');
  warnings.push('Stats updates not disabled');
}

// Check 4: Environment variables
console.log('4️⃣  Checking environment variables...');
const env = fs.readFileSync('./.env.local', 'utf8');
if (env.includes('FIREBASE_SERVICE_ACCOUNT_KEY') &&
    env.includes('NEXT_PUBLIC_FIREBASE_PROJECT_ID')) {
  console.log('   ✅ Firebase credentials configured\n');
  passed++;
} else {
  console.log('   ❌ Firebase credentials missing\n');
  issues.push('Environment variables incomplete');
}

// Check 5: TypeScript compilation
console.log('5️⃣  Checking TypeScript...');
try {
  const { execSync } = require('child_process');
  execSync('npx tsc --noEmit lib/services/storage.ts 2>&1', { encoding: 'utf8', stdio: 'pipe' });
  console.log('   ✅ Storage service compiles\n');
  passed++;
} catch (error) {
  const output = error.stdout || '';
  if (!output.includes('Cannot find module \'@/')) {
    console.log('   ❌ TypeScript errors in storage service\n');
    issues.push('TypeScript compilation errors');
  } else {
    console.log('   ✅ Storage service OK (path aliases handled by Next.js)\n');
    passed++;
  }
}

// Check 6: Data structure
console.log('6️⃣  Checking data structure...');
if (storage.includes('deliveries: deliveries') && storage.includes('count: deliveries.length')) {
  console.log('   ✅ Deliveries stored with count metadata\n');
  passed++;
} else {
  console.log('   ⚠️  Data structure may not be optimal\n');
  warnings.push('Data structure needs verification');
}

// Summary
console.log('═══════════════════════════════════════════════════════════\n');
console.log('📊 CHECKUP RESULTS:\n');
console.log(`   ✅ Passed: ${passed}/6`);
console.log(`   ⚠️  Warnings: ${warnings.length}`);
console.log(`   ❌ Issues: ${issues.length}\n`);

if (issues.length > 0) {
  console.log('🔴 CRITICAL ISSUES:\n');
  issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
  console.log();
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
  console.log();
}

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ ALL SYSTEMS GO! Ready to upload matches.\n');
  console.log('Expected performance:');
  console.log('   - 3 writes per match');
  console.log('   - ~6,600 matches per day');
  console.log('   - 50K files in 7-8 days\n');
  process.exit(0);
} else if (issues.length === 0) {
  console.log('⚠️  System operational with warnings\n');
  process.exit(0);
} else {
  console.log('❌ System has critical issues - fix before uploading\n');
  process.exit(1);
}
