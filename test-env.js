/**
 * Test environment variable loading
 */

const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      envVars[key.trim()] = value.slice(1, -1);
    } else {
      envVars[key.trim()] = value;
    }
  }
});

console.log('\\n🔍 Environment Variable Test\\n');
console.log('═══════════════════════════════════════════════════════════\\n');

const serviceAccountKey = envVars.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.log('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local\\n');
  process.exit(1);
}

console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY found');
console.log(`   Length: ${serviceAccountKey.length} characters\\n`);

try {
  const decoded = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
  const serviceAccount = JSON.parse(decoded);

  console.log('✅ Successfully decoded and parsed service account');
  console.log(`   client_email: ${serviceAccount.client_email ? '✅ Present' : '❌ Missing'}`);
  console.log(`   private_key: ${serviceAccount.private_key ? '✅ Present' : '❌ Missing'}`);
  console.log(`   project_id: ${serviceAccount.project_id || 'N/A'}\\n`);

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    console.log('❌ Service account is missing required fields!\\n');
    console.log('Available fields:', Object.keys(serviceAccount).join(', '), '\\n');
    process.exit(1);
  }

  console.log('✅ Service account is valid!\\n');
  process.exit(0);
} catch (error) {
  console.log('❌ Failed to decode/parse service account');
  console.log(`   Error: ${error.message}\\n`);
  console.log(`   First 100 chars: ${serviceAccountKey.substring(0, 100)}...\\n`);
  process.exit(1);
}
