# Cricket Analysis Platform

> Professional cricket analysis platform that transforms [Cricsheet](https://cricsheet.org) ball-by-ball data into meaningful insights for analysts, journalists, fans, and teams.

---

## 🏏 Project Overview

This platform enables cricket analysis from **ANY perspective imaginable** by providing:

- **Multi-dimensional filtering** across 8 core dimensions (Time, Players, Teams, Venues, Format, Match Phase, Context, Competition)
- **Comprehensive statistics** - batting, bowling, fielding, partnerships, team performance
- **Advanced analytics** - trends, patterns, matchups, predictions
- **Cricket-specific visualizations** - wagon wheels, manhattan charts, pitch maps
- **Auto-generated insights** - records, anomalies, correlations
- **Flexible query builder** - complex filters with unlimited combinations

---

## 📁 Project Structure

```
cricket-data/
├── ARCHITECTURE.md              # System architecture & design decisions
├── IMPLEMENTATION_PLAN.md       # Detailed 12-week development roadmap
├── README.md                    # This file
├── package.json                 # Dependencies
├── .env.local.example          # Environment variables template
│
├── types/
│   └── cricket.ts              # TypeScript type definitions ✓
│
├── lib/
│   ├── parser/
│   │   ├── cricsheet-parser.ts # Cricsheet YAML/JSON parser ✓
│   │   ├── validator.ts        # Data validation with Zod ✓
│   │   └── enricher.ts         # Data enrichment (TODO)
│   │
│   ├── analytics/
│   │   ├── stats-calculator.ts # Statistics computation (TODO)
│   │   ├── query-engine.ts     # Complex query handling (TODO)
│   │   ├── aggregator.ts       # Data aggregation (TODO)
│   │   └── insights-generator.ts # Pattern detection (TODO)
│   │
│   └── services/
│       ├── storage.ts          # Firestore operations (TODO)
│       ├── player-service.ts   # Player analytics (TODO)
│       ├── team-service.ts     # Team analytics (TODO)
│       └── match-service.ts    # Match analytics (TODO)
│
├── app/
│   ├── api/
│   │   ├── upload/route.ts     # File upload endpoint (TODO)
│   │   ├── matches/[id]/       # Match APIs (TODO)
│   │   ├── players/[id]/       # Player APIs (TODO)
│   │   ├── teams/[id]/         # Team APIs (TODO)
│   │   └── insights/           # Insights API (TODO)
│   │
│   ├── admin/
│   │   └── upload/page.tsx     # Upload interface (TODO)
│   │
│   ├── players/[id]/page.tsx   # Player dashboard (TODO)
│   ├── teams/[id]/page.tsx     # Team dashboard (TODO)
│   ├── matches/[id]/page.tsx   # Match viewer (TODO)
│   └── leaderboards/page.tsx   # Leaderboards (TODO)
│
└── components/
    ├── Dashboard/              # Dashboard components (TODO)
    ├── Visualizations/         # Charts & graphs (TODO)
    └── QueryBuilder/           # Filter interface (TODO)
```

**Legend:**
- ✓ = Completed
- TODO = Pending implementation

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Firebase** project (for Firestore database)
- **Vercel** account (for deployment, optional)

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- **Next.js 16** - React framework
- **Firebase/Firestore** - Database
- **js-yaml** - YAML parsing
- **Zod** - Schema validation
- **Recharts** - Visualizations
- **TanStack Query** - Data fetching
- **TypeScript** - Type safety

### Step 2: Configure Firebase

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project
   - Enable Firestore Database

2. **Get Firebase Credentials:**
   - Project Settings > Service accounts
   - Generate new private key (JSON file)
   - Base64 encode the JSON file:
     ```bash
     cat path/to/serviceAccountKey.json | base64
     ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add:
   ```env
   # Firebase Admin SDK (base64 encoded)
   FIREBASE_SERVICE_ACCOUNT_KEY="your_base64_encoded_key"

   # Firebase Client Config (from Firebase Console > Project Settings)
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
   NEXT_PUBLIC_FIREBASE_APP_ID="..."
   ```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Data Source: Cricsheet

### What is Cricsheet?

[Cricsheet](https://cricsheet.org) is a free, open-source repository of ball-by-ball cricket data covering:

- **International Cricket:** Tests, ODIs, T20Is (2004+)
- **T20 Leagues:** IPL, BBL, PSL, CPL, The Hundred, SA20, ILT20
- **Women's Cricket:** All formats
- **Domestic Cricket:** Select matches

### Download Data

1. **Visit:** https://cricsheet.org/downloads/
2. **Download:** YAML or JSON files for specific formats/tournaments
3. **Example:**
   - IPL 2024: `ipl_json.zip`
   - All T20s: `t20s_json.zip`
   - All ODIs: `odis_json.zip`

### Data Structure

Each match file contains:

**1. Match Information (`info`):**
- Date, venue, teams, toss, outcome
- Players, officials, competition
- Format, overs, match type

**2. Ball-by-Ball Data (`innings`):**
- Every delivery bowled
- Runs scored, wickets taken
- Player involvement
- Match phase, cumulative stats

**Example YAML:**
```yaml
info:
  dates: [2024-01-15]
  teams: [India, Australia]
  venue: Wankhede Stadium, Mumbai
  match_type: T20
  overs: 20
  toss:
    winner: India
    decision: bat
  outcome:
    winner: India
    by:
      runs: 15

innings:
  - team: India
    overs:
      - over: 0
        deliveries:
          - batter: Rohit Sharma
            bowler: Mitchell Starc
            runs: {batter: 4, extras: 0, total: 4}
          - ...
```

---

## 🧪 Testing the Parser

Test the Cricsheet parser with a sample file:

```typescript
// test-parser.ts
import fs from 'fs';
import { CricsheetParser } from './lib/parser/cricsheet-parser';
import { CricsheetValidator } from './lib/parser/validator';

// Read a Cricsheet file
const fileContent = fs.readFileSync('sample-match.yaml', 'utf-8');

// Parse the file
const raw = CricsheetParser.parseFile(fileContent, 'yaml');

// Validate
const validation = CricsheetValidator.validate(raw);
console.log(CricsheetValidator.getSummary(validation));

if (validation.valid) {
  // Extract match data
  const matchInfo = CricsheetParser.extractMatchInfo(raw);
  const deliveries = CricsheetParser.extractDeliveries(raw, matchInfo.match_id);
  const innings = CricsheetParser.calculateInnings(raw, deliveries, matchInfo.match_id);

  console.log('Match ID:', matchInfo.match_id);
  console.log('Teams:', matchInfo.teams);
  console.log('Winner:', matchInfo.outcome.winner);
  console.log('Total Deliveries:', deliveries.length);
  console.log('Innings:', innings.length);
}
```

Run with:
```bash
npx ts-node test-parser.ts
```

---

## 🗄️ Database Design

### Firestore Collections

```
cricket-data/
├── matches/              # Match documents
│   └── {match_id}/
│       ├── info          # Match metadata
│       └── subcollections:
│           ├── deliveries/   # Ball-by-ball
│           ├── innings/      # Innings summaries
│           └── partnerships/ # Partnerships
│
├── players/              # Player profiles
│   └── {player_id}/
│       ├── profile
│       └── subcollections:
│           ├── career_stats/
│           ├── by_venue/
│           └── by_opposition/
│
├── teams/                # Team profiles
├── venues/               # Venue profiles
├── leaderboards/         # Pre-computed rankings
└── insights/             # Auto-generated insights
```

### Why Firestore?

- **NoSQL Flexibility:** Store complex nested data
- **Scalability:** Handles millions of deliveries
- **Real-time:** Live updates (future feature)
- **Subcollections:** Organize hierarchical data
- **Firebase Integration:** Auth, storage, functions

---

## 🎯 Core Features (Planned)

### 1. Multi-Dimensional Analysis

Query across 8 dimensions:
- **Time:** Date ranges, seasons, career phases
- **Players:** Individual stats, matchups
- **Teams:** Team performance, head-to-head
- **Venues:** Ground characteristics
- **Format:** Test, ODI, T20
- **Phase:** Powerplay, middle, death overs
- **Context:** Toss, captaincy, situation
- **Competition:** Tournaments, series

**Example Queries:**
- "Virat Kohli in IPL 2016-2020, batting at #3, successful chases, away venues"
- "Bumrah vs Starc in death overs (16-20) in ODIs at neutral venues"
- "Teams defending <150 in T20s in last 5 years"

### 2. Advanced Analytics

- **Performance Trends:** Career trajectories, form analysis
- **Comparative Analysis:** Player vs player, team vs team
- **Matchup Analysis:** Batter vs bowler, team vs opposition
- **Situation-Based:** Chasing, defending, pressure scenarios
- **Phase-Specific:** Powerplay, middle, death overs
- **Impact Metrics:** Match-winning performances

### 3. Visualizations

**Cricket-Specific:**
- Wagon Wheel (shot distribution)
- Manhattan Chart (over-by-over runs)
- Pitch Map (bowling zones)
- Worm Chart (match progression)
- Beehive (ball-by-ball runs)

**Standard Analytics:**
- Line charts (career progression)
- Bar charts (venue comparison)
- Radar charts (multi-attribute)
- Scatter plots (SR vs Avg)
- Heatmaps (effectiveness zones)

### 4. Insights Engine

Auto-generate insights:
- **Records:** Fastest to X, highest at Y
- **Trends:** Hot streaks, slumps
- **Anomalies:** Unusual performances
- **Correlations:** Toss impact, partnership effects
- **Predictions:** Win probability, form forecasts

---

## 📋 Development Roadmap

### Phase 1: Foundation (Weeks 1-2) ✓ COMPLETED
- [x] Project setup
- [x] Type definitions
- [x] Data parser
- [x] Validator

### Phase 2: Data Ingestion (Weeks 3-4) - NEXT
- [ ] Upload system
- [ ] Firestore storage
- [ ] Query engine
- [ ] Statistics calculator

### Phase 3: Core Analytics (Weeks 5-6)
- [ ] Player/Team/Match APIs
- [ ] Analytics services
- [ ] Caching layer

### Phase 4: Frontend (Weeks 7-8)
- [ ] Component library
- [ ] Dashboards
- [ ] Visualizations

### Phase 5: Advanced Features (Weeks 9-10)
- [ ] Query builder
- [ ] Leaderboards
- [ ] Insights engine

### Phase 6: Polish (Weeks 11-12)
- [ ] Performance optimization
- [ ] Testing
- [ ] Documentation
- [ ] Deployment

**See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed breakdown.**

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

---

## 📖 Key Documents

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, tech stack, database schema |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | 12-week development roadmap |
| [types/cricket.ts](./types/cricket.ts) | TypeScript type definitions |
| [lib/parser/cricsheet-parser.ts](./lib/parser/cricsheet-parser.ts) | Cricsheet parser implementation |
| [lib/parser/validator.ts](./lib/parser/validator.ts) | Data validation logic |

---

## 🎨 Design Principles

1. **Data is the foundation, insights are the product**
   - Raw data → Processed → Analyzed → Visualized → Insights

2. **Analysis from ANY perspective**
   - Unlimited combinations of filters
   - Multi-dimensional queries
   - Context-aware statistics

3. **Performance first**
   - Aggressive caching
   - Pre-computed aggregations
   - Optimized queries
   - Lazy loading

4. **Type safety everywhere**
   - TypeScript strict mode
   - Zod runtime validation
   - Comprehensive type definitions

5. **Cricket-first UX**
   - Domain-specific visualizations
   - Cricket terminology
   - Context-aware insights

---

## 🚧 Next Steps

### Immediate (Week 3):
1. **Implement Upload System**
   - Create upload API route
   - Build file upload UI
   - Integrate parser with Firestore

2. **Set up Firestore Schema**
   - Create collections
   - Define security rules
   - Set up indexes

3. **Build Storage Service**
   - Save match data
   - Update player/team stats
   - Handle transactions

### Short Term (Weeks 4-6):
- Query engine
- Statistics calculator
- Player/Team APIs
- Basic dashboards

### Medium Term (Weeks 7-10):
- Visualizations
- Query builder
- Leaderboards
- Insights engine

---

## 🤝 Contributing

This is currently a solo project following a structured 12-week development plan. Future contributions will be welcome after initial launch.

---

## 📄 License

This project uses data from [Cricsheet](https://cricsheet.org), which is provided under Creative Commons Attribution 4.0 International License.

---

## 🔗 Resources

### Cricsheet
- **Website:** https://cricsheet.org
- **Downloads:** https://cricsheet.org/downloads/
- **Format Documentation:** https://cricsheet.org/format/
- **Player Registry:** https://cricsheet.org/register/

### Technologies
- **Next.js:** https://nextjs.org/docs
- **Firebase:** https://firebase.google.com/docs/firestore
- **Recharts:** https://recharts.org/
- **Zod:** https://zod.dev/
- **TanStack Query:** https://tanstack.com/query

### Cricket Analytics
- **CricViz:** https://cricviz.com
- **ESPN Cricinfo:** https://www.espncricinfo.com/stats
- **ICC Rankings:** https://www.icc-cricket.com/rankings

---

## 📞 Support

For questions or issues:
1. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions
2. Check [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for roadmap
3. Review [Cricsheet format docs](https://cricsheet.org/format/)

---

## 🎯 Vision

To build the most comprehensive, flexible, and insightful cricket analysis platform that enables:

- **Analysts** to uncover hidden patterns
- **Journalists** to find compelling stories
- **Fans** to explore their favorite players/teams
- **Teams** to gain competitive insights

All powered by Cricsheet's incredible ball-by-ball data.

---

**Built with ❤️ for cricket analytics**
