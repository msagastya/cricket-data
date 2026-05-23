# Development Guide - Cricket Analysis Platform

**Phase 2 Complete** ✓ | **Status:** Ready for Testing & Use
**Date:** November 27, 2024

---

## 🎉 What's Been Built

### Phase 1: Foundation ✓
- [x] Architecture & database schema design
- [x] TypeScript type definitions (50+ interfaces)
- [x] Cricsheet parser (YAML/JSON)
- [x] Data validator (Zod schemas)

### Phase 2: Data Ingestion & Storage ✓
- [x] Firebase client & admin initialization
- [x] Storage service (Firestore operations)
- [x] Upload API endpoint
- [x] Upload UI (drag-and-drop interface)
- [x] Matches list page
- [x] Basic navigation and layout

---

## 🚀 Getting Started

### Step 1: Install Dependencies

```bash
npm install
```

**What gets installed:**
- Next.js 16, React 19, TypeScript 5
- Firebase & Firebase Admin
- js-yaml (YAML parsing)
- Zod (validation)
- uuid (unique IDs)
- Tailwind CSS 4
- Lucide React (icons)

### Step 2: Configure Firebase

#### Option A: Quick Setup (Existing Firebase Project)

If you already have Firebase credentials in `.env.local`, skip to Step 3.

#### Option B: Create New Firebase Project

1. **Go to Firebase Console**
   ```
   https://console.firebase.google.com
   ```

2. **Create Project**
   - Click "Add project"
   - Name: `cricket-analysis` (or your choice)
   - Disable Google Analytics (optional)
   - Click "Create Project"

3. **Enable Firestore**
   - In Firebase Console, go to **Build** → **Firestore Database**
   - Click "Create database"
   - Start in **test mode** (we'll add security rules later)
   - Choose location (e.g., `us-central`)
   - Click "Enable"

4. **Get Service Account Key** (for server-side)
   - Go to **Project Settings** (⚙️ gear icon)
   - Navigate to **Service accounts** tab
   - Click **"Generate new private key"**
   - Download the JSON file (keep it secure!)

5. **Get Client Config** (for client-side)
   - Go to **Project Settings** → **General** tab
   - Scroll to **"Your apps"** section
   - Click the **Web** icon (`</>`) to create a web app
   - Register app name: `cricket-analysis-web`
   - Copy the `firebaseConfig` object

6. **Configure Environment Variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:

   ```env
   # SERVER-SIDE (Admin SDK)
   # Base64 encode your service account JSON:
   # macOS/Linux: cat firebase-key.json | base64 | tr -d '\n'
   # Windows: [Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-key.json"))
   FIREBASE_SERVICE_ACCOUNT_KEY="<your_base64_encoded_json>"

   # CLIENT-SIDE (from Firebase Console config)
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
   cat encoded.txt  # Copy this value

   # Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("firebase-key.json")) > encoded.txt
   type encoded.txt  # Copy this value
   ```

### Step 3: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

**Expected Result:**
- ✅ Home page loads with hero section
- ✅ Navigation bar visible
- ✅ "Upload Data" button in header
- ✅ No console errors

---

## 📥 Testing the Upload System

### Download Sample Data

**Option 1: Download Full Tournament**
```bash
# Create data directory
mkdir -p data/cricsheet

# Download IPL 2024 (JSON format)
curl -L https://cricsheet.org/downloads/ipl_json.zip -o data/cricsheet/ipl.zip
unzip data/cricsheet/ipl.zip -d data/cricsheet/ipl/

# You should now have ~70+ JSON files
ls data/cricsheet/ipl/ | wc -l
```

**Option 2: Download All T20s**
```bash
curl -L https://cricsheet.org/downloads/t20s_json.zip -o data/cricsheet/t20s.zip
unzip data/cricsheet/t20s.zip -d data/cricsheet/t20s/
```

**Option 3: Create Sample Match File**

Create `data/sample-match.json`:

```json
{
  "info": {
    "balls_per_over": 6,
    "city": "Mumbai",
    "dates": ["2024-01-15"],
    "event": {
      "name": "Indian Premier League"
    },
    "gender": "male",
    "match_type": "T20",
    "overs": 20,
    "outcome": {
      "winner": "Mumbai Indians",
      "by": { "runs": 15 }
    },
    "players": {
      "Mumbai Indians": ["Rohit Sharma", "Ishan Kishan", "Jasprit Bumrah"],
      "Chennai Super Kings": ["MS Dhoni", "Ruturaj Gaikwad", "Ravindra Jadeja"]
    },
    "registry": {
      "people": {
        "Rohit Sharma": "rohit-sharma",
        "Ishan Kishan": "ishan-kishan",
        "MS Dhoni": "ms-dhoni"
      }
    },
    "season": "2024",
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
              "runs": { "batter": 4, "extras": 0, "total": 4 }
            }
          ]
        }
      ]
    }
  ]
}
```

### Upload via UI

1. **Navigate to Upload Page**
   - Click "Upload Data" in the header
   - Or go to http://localhost:3000/admin/upload

2. **Upload File**
   - **Method 1:** Drag and drop a `.json` or `.yaml` file
   - **Method 2:** Click "Choose File" and select file

3. **Monitor Progress**
   - File validation happens immediately
   - Click "Upload" button
   - Watch for success/error message

4. **Expected Success Response**
   ```
   ✅ Upload Successful!
   Match: Mumbai Indians vs Chennai Super Kings
   Date: 2024-01-15
   Venue: Wankhede Stadium
   Format: T20

   Processed 240 deliveries, 2 innings, updated 22 player records
   Match ID: t20_mumbai_indians_vs_chennai_super_kings_20240115_wankhede_stadium
   ```

5. **Verify in Firestore**
   - Go to Firebase Console
   - Open Firestore Database
   - Check these collections:
     - `matches/` - Should have 1 document
     - `players/` - Should have ~11 documents
     - `teams/` - Should have 2 documents
     - `venues/` - Should have 1 document
     - `upload_status/` - Should have 1 document

### Upload via API (cURL)

```bash
# Upload a file via API
curl -X POST http://localhost:3000/api/upload \
  -F "file=@data/cricsheet/ipl/1234567.json"

# Expected response:
{
  "success": true,
  "upload_id": "abc-123-def",
  "match_id": "t20_...",
  "match_info": { ... },
  "stats": {
    "deliveries": 240,
    "innings": 2,
    "players_updated": 22
  }
}
```

---

## 🔍 Exploring Data

### View Matches List

1. Navigate to http://localhost:3000/matches
2. You should see all uploaded matches
3. Each card shows:
   - Teams
   - Winner
   - Date
   - Venue
   - Format (T20, ODI, Test)

### Check Upload History

1. Go to http://localhost:3000/admin/upload
2. Scroll down to "Recent Uploads" section
3. See list of all uploads with status

### Query Firestore (Firebase Console)

1. **View All Matches**
   - Collection: `matches`
   - Should see documents with format: `t20_team1_vs_team2_...`

2. **View Match Details**
   - Click on any match document
   - See `info`, `dates`, `teams`, `outcome`, etc.

3. **View Deliveries** (Subcollection)
   - Open any match document
   - Click "Subcollections" tab
   - Open `deliveries`
   - See ball-by-ball data

4. **View Players**
   - Collection: `players`
   - See documents like `rohit-sharma`, `ms-dhoni`
   - Open any player document
   - See `career_stats` by format

---

## 🧪 Testing & Validation

### Run Type Check

```bash
npm run type-check
```

**Expected:**
```
✨ No type errors found!
```

### Test File Validation

**Create invalid file:** `data/invalid.json`
```json
{
  "info": {
    "teams": ["Only One Team"]
  }
}
```

**Upload it:**
- Should fail with validation errors
- Error message: "Match must have exactly 2 teams"

### Test Duplicate Detection

1. Upload a match file successfully
2. Try uploading the same file again
3. Should get error: `"Match already exists"`

### Test File Size Limit

Create a file > 10MB and try uploading.

**Expected:** Error: "File too large"

### Test Invalid File Type

Try uploading a `.txt` or `.pdf` file.

**Expected:** Error: "Invalid file type"

---

## 📊 Database Structure (What's Created)

After uploading one match, here's what gets stored:

```
Firestore Collections:

matches/
├── t20_mumbai_indians_vs_chennai_super_kings_20240115_wankhede_stadium/
│   ├── match_id: "t20_..."
│   ├── dates: ["2024-01-15"]
│   ├── teams: ["Mumbai Indians", "Chennai Super Kings"]
│   ├── venue: "Wankhede Stadium"
│   ├── outcome: { winner: "Mumbai Indians", by: { runs: 15 } }
│   └── subcollections/
│       ├── deliveries/ (~240 documents)
│       │   ├── innings_1_over_0_ball_1
│       │   ├── innings_1_over_0_ball_2
│       │   └── ...
│       ├── innings/ (2 documents)
│       │   ├── innings_1
│       │   └── innings_2
│       └── partnerships/ (~10-15 documents)
│
players/
├── rohit-sharma/
│   ├── player_id: "rohit-sharma"
│   ├── name: "Rohit Sharma"
│   ├── total_matches: 1
│   └── career_stats: {
│       T20: {
│         batting: { runs: 75, average: 75, strike_rate: 150, ... },
│         bowling: { ... }
│       }
│     }
├── ms-dhoni/
└── ...

teams/
├── mumbai_indians/
│   ├── team_id: "mumbai_indians"
│   ├── name: "Mumbai Indians"
│   └── record: {
│       T20: { played: 1, won: 1, lost: 0, ... }
│     }
└── chennai_super_kings/

venues/
└── wankhede_stadium/
    ├── venue_id: "wankhede_stadium"
    ├── name: "Wankhede Stadium"
    ├── city: "Mumbai"
    └── stats_by_format: {
        T20: { matches_played: 1, avg_first_innings: 180, ... }
      }

upload_status/
└── abc-123-def-456/
    ├── upload_id: "abc-123-def-456"
    ├── filename: "match.json"
    ├── status: "completed"
    ├── result: { match_id: "...", deliveries_processed: 240, ... }
    └── created_at: 2024-11-27T...
```

---

## 🐛 Troubleshooting

### Issue: "Firebase Admin initialization failed"

**Cause:** Service account key not configured or invalid

**Solution:**
1. Check `.env.local` has `FIREBASE_SERVICE_ACCOUNT_KEY`
2. Verify base64 encoding is correct
3. Try re-encoding the JSON file:
   ```bash
   cat firebase-key.json | base64 | tr -d '\n'
   ```

### Issue: "Module not found: Can't resolve '@/types/cricket'"

**Cause:** TypeScript path mapping not working

**Solution:**
```bash
# Rebuild the project
rm -rf .next
npm run dev
```

### Issue: Upload succeeds but no data in Firestore

**Cause:** Firestore rules may be blocking writes

**Solution:**
1. Go to Firebase Console → Firestore → Rules
2. Temporarily set to test mode:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
3. **Note:** This is for development only! Add proper security rules before production.

### Issue: "CORS error" when uploading

**Cause:** Next.js API route not found or misconfigured

**Solution:**
1. Verify file exists: `app/api/upload/route.ts`
2. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: Validation warnings about missing player registry

**Cause:** Older Cricsheet files may not have player registry

**Solution:**
- This is a warning, not an error
- The parser will still work
- Player IDs will be generated from names
- Download newer files from Cricsheet for full registry support

---

## 📈 Next Steps

Now that Phase 2 is complete, you can:

### Immediate Actions:

1. **Upload Multiple Matches**
   - Bulk upload entire tournaments
   - Build up your database

2. **Explore Data**
   - Browse matches list
   - Check Firestore console

3. **Test Edge Cases**
   - Super Over matches
   - Tied matches
   - Rain-affected matches (D/L method)

### Phase 3: Analytics (Week 5-6)

Coming next:
- [ ] Player profile pages with detailed stats
- [ ] Team analytics pages
- [ ] Match detail viewer with ball-by-ball
- [ ] Statistics API endpoints
- [ ] Query engine for complex filters

See `IMPLEMENTATION_PLAN.md` for full roadmap.

---

## 🎯 Success Checklist

- [ ] Dependencies installed (`npm install` runs without errors)
- [ ] Firebase configured (`.env.local` has all keys)
- [ ] Dev server starts (`npm run dev` works)
- [ ] Home page loads (http://localhost:3000)
- [ ] Upload page loads (http://localhost:3000/admin/upload)
- [ ] File upload works (can drag-and-drop or select file)
- [ ] Match uploads successfully (see success message)
- [ ] Data appears in Firestore (check Firebase Console)
- [ ] Matches list shows uploaded matches (http://localhost:3000/matches)
- [ ] No TypeScript errors (`npm run type-check` passes)

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `lib/firebase.ts` | Client-side Firebase init |
| `lib/firebase-admin.ts` | Server-side Firebase init |
| `lib/parser/cricsheet-parser.ts` | YAML/JSON parser |
| `lib/parser/validator.ts` | Data validation |
| `lib/services/storage.ts` | Firestore operations |
| `app/api/upload/route.ts` | Upload API endpoint |
| `app/admin/upload/page.tsx` | Upload UI |
| `app/matches/page.tsx` | Matches list |
| `app/api/matches/route.ts` | Matches API |
| `types/cricket.ts` | TypeScript types |

---

## 🎓 Learning Resources

### Cricsheet
- **Downloads:** https://cricsheet.org/downloads/
- **Format Docs:** https://cricsheet.org/format/
- **Registry:** https://cricsheet.org/register/

### Next.js
- **App Router:** https://nextjs.org/docs/app
- **API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### Firebase
- **Firestore:** https://firebase.google.com/docs/firestore
- **Admin SDK:** https://firebase.google.com/docs/admin/setup

---

**Phase 2 Complete! 🎉**

You now have a fully functional cricket data upload and storage system. Upload your first match and start exploring!

**Questions?** Check:
- `README.md` - Project overview
- `ARCHITECTURE.md` - System design
- `IMPLEMENTATION_PLAN.md` - Development roadmap
- `QUICKSTART.md` - 10-minute setup guide
