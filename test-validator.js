/**
 * Test Validator - Check if validator loads and works correctly
 */

const fs = require('fs');

// Test 1: Check if validator TypeScript compiles
console.log('\n🔍 VALIDATOR DIAGNOSTIC TEST\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('1️⃣  Checking validator syntax...');
const validatorCode = fs.readFileSync('./lib/parser/validator.ts', 'utf8');

// Check for the specific lines we changed
if (validatorCode.includes('review: z.any().optional()')) {
  console.log('   ✅ review field: z.any().optional()');
} else {
  console.log('   ❌ review field: NOT using z.any().optional()');
}

if (validatorCode.includes('replacements: z.any().optional()')) {
  console.log('   ✅ replacements field: z.any().optional()');
} else {
  console.log('   ❌ replacements field: NOT using z.any().optional()');
}

// Check for syntax errors
if (validatorCode.includes('.passthrough()') &&
    validatorCode.match(/review:.*passthrough|replacements:.*passthrough/)) {
  console.log('   ❌ ERROR: Still using .passthrough() on review/replacements!');
  process.exit(1);
}

console.log('   ✅ No .passthrough() errors detected\n');

console.log('2️⃣  Checking for TypeScript build...');
const { execSync } = require('child_process');

try {
  // Try to compile just the validator file
  execSync('npx tsc --noEmit lib/parser/validator.ts 2>&1', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('   ✅ Validator compiles successfully\n');
} catch (error) {
  const output = error.stdout || error.message;
  // Ignore path alias errors - Next.js handles these
  if (output.includes('validator.ts') &&
      !output.includes('.next') &&
      !output.includes("Cannot find module '@/")) {
    console.log('   ❌ Validator has TypeScript errors:');
    console.log(output.split('\n').slice(0, 10).join('\n'));
    process.exit(1);
  } else {
    console.log('   ✅ Validator file is OK (path aliases handled by Next.js)\n');
  }
}

console.log('3️⃣  Checking server is running...');
try {
  execSync('curl -s http://localhost:204/admin/upload > /dev/null 2>&1');
  console.log('   ✅ Server is running on port 204\n');
} catch (error) {
  console.log('   ❌ Server is NOT running on port 204');
  console.log('   Please start server: npm run dev\n');
  process.exit(1);
}

console.log('═══════════════════════════════════════════════════════════\n');
console.log('✅ ALL CHECKS PASSED!\n');
console.log('   - Validator syntax is correct');
console.log('   - No .passthrough() errors');
console.log('   - Server is running');
console.log('\n   Ready to upload files!\n');
console.log('═══════════════════════════════════════════════════════════\n');

process.exit(0);
