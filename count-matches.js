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

// Load service account
const serviceAccountPath = path.join(__dirname, 'cricket-analysis-7761c-firebase-adminsdk-fbsvc-1b0aae5938.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function countMatches() {
  const matchesSnapshot = await db.collection('matches').get();
  console.log(`\nTotal matches in database: ${matchesSnapshot.size}\n`);
  process.exit(0);
}

countMatches().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
