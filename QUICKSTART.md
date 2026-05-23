# Quick Start Guide

Get up and running with the Cricket Analysis Platform in 10 minutes.

---

## Step 1: Install Dependencies (2 minutes)

```bash
cd cricket-data
npm install
```

Expected output:
```
added 247 packages in 45s
```

---

## Step 2: Configure Firebase (3 minutes)

### Option A: Use Existing Firebase Project

If you already have Firebase credentials in `.env.local`, skip to Step 3.

### Option B: Create New Firebase Project

1. **Go to Firebase Console:** https://console.firebase.google.com
2. **Create Project:**
   - Click "Add project"
   - Name: "cricket-analysis"
   - Disable Google Analytics (optional)

3. **Enable Firestore:**
   - Build → Firestore Database
   - Create database (start in test mode)

4. **Get Service Account Key:**
   - Project Settings (⚙️) → Service accounts
   - Click "Generate new private key"
   - Download JSON file

5. **Get Client Config:**
   - Project Settings (⚙️) → General
   - Scroll to "Your apps" → Web app
   - Copy the config object

6. **Configure Environment:**

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Admin SDK - Base64 encode your service account JSON:
# cat firebase-key.json | base64 | pbcopy
FIREBASE_SERVICE_ACCOUNT_KEY="<base64_encoded_json>"

# Client Config - Copy from Firebase Console
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="cricket-analysis.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="cricket-analysis"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="cricket-analysis.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abc123"
```

**Quick Base64 Encoding:**
```bash
# macOS/Linux
cat path/to/firebase-key.json | base64 | tr -d '\n' > encoded.txt

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-key.json")) > encoded.txt
```

---

## Step 3: Download Sample Cricket Data (1 minute)

### Option A: Download from Cricsheet

```bash
# Create data directory
mkdir -p data/matches

# Download IPL 2024 data (example)
curl -L https://cricsheet.org/downloads/ipl_json.zip -o data/ipl.zip
unzip data/ipl.zip -d data/matches/

# You should now have ~70 JSON files in data/matches/
```

### Option B: Use Sample Data

Create `data/sample-match.json`:

```json
{
  "info": {
    "balls_per_over": 6,
    "city": "Mumbai",
    "dates": ["2024-01-15"],
    "event": {
      "name": "Indian Premier League",
      "match_number": 1
    },
    "gender": "male",
    "match_type": "T20",
    "overs": 20,
    "outcome": {
      "winner": "Mumbai Indians",
      "by": {
        "runs": 15
      }
    },
    "player_of_match": ["Rohit Sharma"],
    "players": {
      "Mumbai Indians": ["Rohit Sharma", "Ishan Kishan"],
      "Chennai Super Kings": ["MS Dhoni", "Ruturaj Gaikwad"]
    },
    "registry": {
      "people": {
        "Rohit Sharma": "rohit-sharma",
        "Ishan Kishan": "ishan-kishan",
        "MS Dhoni": "ms-dhoni",
        "Ruturaj Gaikwad": "ruturaj-gaikwad"
      }
    },
    "season": "2024",
    "team_type": "club",
    "teams": ["Mumbai Indians", "Chennai Super Kings"],
    "toss": {
      "winner": "Mumbai Indians",
      "decision": "bat"
    },
    "venue": "Wankhede Stadium"
  },
  "innings": [
    {
      "team": "Mumbai Indians",
      "overs": [
        {
          "over": 0,
          "deliveries": [
            {
              "batter": "Rohit Sharma",
              "bowler": "Deepak Chahar",
              "non_striker": "Ishan Kishan",
              "runs": {
                "batter": 4,
                "extras": 0,
                "total": 4
              }
            },
            {
              "batter": "Rohit Sharma",
              "bowler": "Deepak Chahar",
              "non_striker": "Ishan Kishan",
              "runs": {
                "batter": 0,
                "extras": 0,
                "total": 0
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Step 4: Test the Parser (2 minutes)

Create `scripts/test-parser.ts`:

```typescript
import fs from 'fs';
import { CricsheetParser } from '../lib/parser/cricsheet-parser';
import { CricsheetValidator } from '../lib/parser/validator';

async function testParser() {
  console.log('🏏 Cricket Data Parser Test\n');

  // Read sample file
  const filePath = process.argv[2] || 'data/sample-match.json';

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('Usage: npx ts-node scripts/test-parser.ts <path-to-match-file>');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  console.log(`📄 Reading: ${filePath}\n`);

  // Parse
  try {
    const raw = CricsheetParser.parseFile(fileContent, 'json');
    console.log('✅ File parsed successfully\n');

    // Validate
    const validation = CricsheetValidator.validate(raw);
    console.log('--- VALIDATION RESULT ---');
    console.log(CricsheetValidator.getSummary(validation));
    console.log('');

    if (!validation.valid) {
      console.error('❌ Validation failed');
      process.exit(1);
    }

    // Extract data
    const matchInfo = CricsheetParser.extractMatchInfo(raw);
    const deliveries = CricsheetParser.extractDeliveries(raw, matchInfo.match_id);
    const innings = CricsheetParser.calculateInnings(raw, deliveries, matchInfo.match_id);

    // Display results
    console.log('--- MATCH SUMMARY ---');
    console.log(`Match ID: ${matchInfo.match_id}`);
    console.log(`Date: ${matchInfo.dates[0].toLocaleDateString()}`);
    console.log(`Venue: ${matchInfo.venue}, ${matchInfo.city}`);
    console.log(`Teams: ${matchInfo.teams[0]} vs ${matchInfo.teams[1]}`);
    console.log(`Format: ${matchInfo.match_type}`);
    console.log(`Winner: ${matchInfo.outcome.winner || 'N/A'}`);
    console.log(`Player of Match: ${matchInfo.player_of_match?.join(', ') || 'N/A'}`);
    console.log('');

    console.log('--- DATA EXTRACTED ---');
    console.log(`Total Deliveries: ${deliveries.length}`);
    console.log(`Innings: ${innings.length}`);
    console.log('');

    // Innings breakdown
    innings.forEach((inn, idx) => {
      console.log(`--- INNINGS ${idx + 1}: ${inn.team} ---`);
      console.log(`Total: ${inn.total_runs}/${inn.total_wickets} in ${inn.overs.toFixed(1)} overs`);
      console.log('');

      console.log('Batting:');
      inn.batters.slice(0, 5).forEach((batter) => {
        const dismissal = batter.dismissal ? ` (${batter.dismissal.kind})` : ' (not out)';
        console.log(
          `  ${batter.player}: ${batter.runs}(${batter.balls}) SR: ${batter.strike_rate.toFixed(1)}${dismissal}`
        );
      });
      console.log('');

      console.log('Bowling:');
      inn.bowlers.slice(0, 5).forEach((bowler) => {
        console.log(
          `  ${bowler.player}: ${bowler.overs} overs, ${bowler.runs} runs, ${bowler.wickets} wkts (Econ: ${bowler.economy.toFixed(2)})`
        );
      });
      console.log('');
    });

    console.log('✅ Parser test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testParser();
```

Run the test:

```bash
# Create scripts directory
mkdir -p scripts

# Save the script above as scripts/test-parser.ts

# Run with sample data
npx ts-node scripts/test-parser.ts data/sample-match.json

# Or test with actual Cricsheet data
npx ts-node scripts/test-parser.ts data/matches/some-match.json
```

Expected output:

```
🏏 Cricket Data Parser Test

📄 Reading: data/sample-match.json

✅ File parsed successfully

--- VALIDATION RESULT ---
Validation Result: ✓ VALID

Match Info:
  Date: 2024-01-15
  Teams: Mumbai Indians vs Chennai Super Kings
  Venue: Wankhede Stadium
  Format: T20

Warnings (2):
  1. Innings 1 (Mumbai Indians): 4 runs, 0 wickets in 2 balls
  2. ...

--- MATCH SUMMARY ---
Match ID: t20_mumbai_indians_vs_chennai_super_kings_20240115_wankhede_stadium
Date: 1/15/2024
Venue: Wankhede Stadium, Mumbai
Teams: Mumbai Indians vs Chennai Super Kings
Format: T20
Winner: Mumbai Indians
Player of Match: Rohit Sharma

--- DATA EXTRACTED ---
Total Deliveries: 2
Innings: 1

--- INNINGS 1: Mumbai Indians ---
Total: 4/0 in 0.2 overs

Batting:
  Rohit Sharma: 4(1) SR: 400.0 (not out)
  Ishan Kishan: 0(1) SR: 0.0 (not out)

Bowling:
  Deepak Chahar: 0.2 overs, 4 runs, 0 wkts (Econ: 12.00)

✅ Parser test completed successfully!
```

---

## Step 5: Start Development Server (1 minute)

```bash
npm run dev
```

Open http://localhost:3000

You should see the Next.js default page (we'll build the cricket UI in Phase 4).

---

## Step 6: Verify TypeScript (1 minute)

```bash
npm run type-check
```

Expected output:
```
✨ No type errors found!
```

---

## Next Steps

Now that your environment is set up:

### Week 3: Build Upload System

1. **Create Upload API** (`app/api/upload/route.ts`)
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { CricsheetParser } from '@/lib/parser/cricsheet-parser';
   import { CricsheetValidator } from '@/lib/parser/validator';

   export async function POST(request: NextRequest) {
     const formData = await request.formData();
     const file = formData.get('file') as File;

     if (!file) {
       return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
     }

     const content = await file.text();
     const format = file.name.endsWith('.json') ? 'json' : 'yaml';

     try {
       const raw = CricsheetParser.parseFile(content, format);
       const validation = CricsheetValidator.validate(raw);

       if (!validation.valid) {
         return NextResponse.json({
           error: 'Validation failed',
           errors: validation.errors
         }, { status: 400 });
       }

       const matchInfo = CricsheetParser.extractMatchInfo(raw);
       const deliveries = CricsheetParser.extractDeliveries(raw, matchInfo.match_id);
       const innings = CricsheetParser.calculateInnings(raw, deliveries, matchInfo.match_id);

       // TODO: Save to Firestore

       return NextResponse.json({
         success: true,
         match_id: matchInfo.match_id,
         match_info: validation.match_info
       });
     } catch (error) {
       return NextResponse.json({
         error: error instanceof Error ? error.message : 'Unknown error'
       }, { status: 500 });
     }
   }
   ```

2. **Create Upload UI** (`app/admin/upload/page.tsx`)

3. **Implement Firestore Storage** (`lib/services/storage.ts`)

### Week 4: Build Query Engine

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed tasks.

---

## Common Issues

### Issue: Firebase Admin SDK Error

```
Error: Failed to parse private key
```

**Solution:** Ensure your service account key is properly base64 encoded:
```bash
cat firebase-key.json | base64 | tr -d '\n'
```

### Issue: Module Resolution Error

```
Cannot find module '@/types/cricket'
```

**Solution:** Restart your TypeScript server or rebuild:
```bash
npm run build
```

### Issue: Validation Warnings

```
Warning: Player registry missing
```

**Solution:** This is normal for older Cricsheet files. The parser will still work, but player IDs may not be available.

---

## Testing with Real Data

Download a full tournament:

```bash
# IPL 2024 (~1000 matches)
curl -L https://cricsheet.org/downloads/ipl_json.zip -o data/ipl.zip
unzip data/ipl.zip -d data/ipl/

# Test with random match
find data/ipl -name "*.json" | head -1 | xargs npx ts-node scripts/test-parser.ts

# Process all matches (coming in Week 3)
# node scripts/bulk-import.js data/ipl/*.json
```

---

## Resources

- **Cricsheet Downloads:** https://cricsheet.org/downloads/
- **Data Format:** https://cricsheet.org/format/
- **Next.js Docs:** https://nextjs.org/docs
- **Firebase Docs:** https://firebase.google.com/docs/firestore

---

**Ready to build! 🚀**

Continue with [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) Week 3 tasks.
