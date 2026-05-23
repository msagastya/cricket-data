# Guide: Uploading 10,000+ Matches

## Prerequisites

1. **Upgrade to Firebase Blaze Plan**
   - Go to Firebase Console > Upgrade
   - Enable pay-as-you-go billing
   - Estimated cost: $1-2/month for 10K matches

2. **Update bulk-upload.js for Better Performance**
   ```javascript
   const CONCURRENT_UPLOADS = 10; // Increase from 5 to 10
   ```

## Step-by-Step Upload Process

### 1. Download Data from Cricsheet
```bash
# Example: Download all IPL matches (2008-2024)
wget https://cricsheet.org/downloads/ipl_male_json.zip
unzip ipl_male_json.zip
# Contains ~1000+ IPL matches

# Download all T20I matches
wget https://cricsheet.org/downloads/t20i_male_json.zip
unzip t20i_male_json.zip
# Contains ~3000+ T20I matches

# Download all ODI matches
wget https://cricsheet.org/downloads/odi_male_json.zip
unzip odi_male_json.zip
# Contains ~5000+ ODI matches
```

### 2. Update Bulk Upload Script Path
```javascript
// In bulk-upload.js
const DATA_DIR = '/path/to/your/downloaded/json/files';
```

### 3. Run Bulk Upload
```bash
node bulk-upload.js
```

Expected time: ~30-60 minutes for 10K matches (with 10 concurrent uploads)

## Performance Optimizations Required

### Critical: Fix Players API

The Players API currently aggregates ALL matches. This will timeout with 10K matches.

**Option 1: Add strict limit (Quick Fix)**
```typescript
// app/api/players/route.ts:69
const matchesSnapshot = await db.collection('matches')
  .orderBy('dates', 'desc')
  .limit(1000)  // Keep at 1000 max
  .get();
```

**Option 2: Pre-aggregate player stats (Better)**
- Create a separate `player_stats` collection
- Update stats incrementally when matches are uploaded
- Much faster than aggregating on-the-fly

### Optional: Add Pagination

For Matches page with 10K+ matches:
```typescript
// Add "Load More" button
// Or implement page numbers (1, 2, 3...)
```

## Monitoring Costs

After uploading, check Firebase Console:
- **Usage tab**: Monitor reads/writes
- **Billing**: Check storage costs
- Set up **budget alerts** at $5/month to avoid surprises

## Storage Estimates

- 1K matches: ~150-300 MB
- 10K matches: ~1.5-3 GB
- 50K matches: ~7.5-15 GB

Cost: ~$0.18/GB/month

## Performance After Upload

- **Matches page**: Fast (uses pagination/limit)
- **Match detail**: Fast (individual match)
- **Players page**: Slower (aggregates 1000 matches max)
- **Leaderboards**: Slower (aggregates 1000 matches max)

Consider adding a note: "Statistics based on recent 1000 matches"
