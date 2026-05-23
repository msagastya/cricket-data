# Cricket Analysis Platform - System Architecture

## Overview
Professional cricket analysis platform transforming Cricsheet ball-by-ball data into actionable insights for analysts, journalists, fans, and teams.

## System Architecture

### Three-Tier Architecture
```
┌─────────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                       │
│  Next.js Frontend - Dashboards, Visualizations, Queries │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                        │
│  API Routes - Business Logic - Analytics Engine         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    DATA LAYER                            │
│  Firestore (Match Data) + Cloud Storage (Raw Files)     │
│  + Edge Config (Computed Statistics)                    │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Next.js 16** (App Router) - React framework with SSR/SSG
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Recharts/Victory** - Cricket-specific visualizations
- **TanStack Query** - Server state management
- **Zustand** - Client state for filters
- **Framer Motion** - Animations

### Backend
- **Firebase/Firestore** - NoSQL database
- **Cloud Functions** - Background processing
- **Cloud Storage** - Raw file storage
- **Vercel Edge Functions** - API endpoints
- **js-yaml** - YAML parsing
- **Zod** - Schema validation

### Data Processing
- **TypeScript** - Data transformations
- **Node.js** - Runtime environment
- **node-cron** - Scheduled tasks

## Database Schema

### Firestore Collections

```
cricket-data/
├── matches/
│   ├── {match_id}/
│   │   ├── info: MatchInfo
│   │   └── subcollections:
│   │       ├── deliveries/     # Ball-by-ball
│   │       ├── innings/        # Innings summaries
│   │       ├── partnerships/   # Partnerships
│   │       └── events/         # Wickets, milestones
│
├── players/
│   ├── {player_id}/
│   │   ├── profile: PlayerProfile
│   │   └── subcollections:
│   │       ├── career_stats/   # By format
│   │       ├── by_venue/
│   │       ├── by_opposition/
│   │       └── by_phase/
│
├── teams/
│   ├── {team_id}/
│   │   └── subcollections:
│   │       ├── matches/
│   │       ├── squad_history/
│   │       └── statistics/
│
├── venues/
│   ├── {venue_id}/
│   │   └── subcollections:
│   │       ├── statistics/
│   │       └── matches/
│
├── leaderboards/
│   ├── {leaderboard_id}/
│   │   ├── entries: LeaderboardEntry[]
│   │   └── metadata: { lastUpdated, filters }
│
└── insights/
    ├── {insight_id}/
    │   ├── type: InsightType
    │   ├── description: string
    │   └── data: any
```

## Data Flow

### 1. Data Ingestion Pipeline
```
Cricsheet YAML/JSON
       ↓
File Upload/Auto-Fetch
       ↓
Validation & Parsing
       ↓
Data Extraction
       ↓
Enrichment & Calculation
       ↓
Firestore Storage
       ↓
Update Aggregations
       ↓
Generate Insights
```

### 2. Query Flow
```
User Query (Frontend)
       ↓
Query Builder
       ↓
API Route
       ↓
Analytics Engine
       ↓
Firestore Query
       ↓
Cache Check
       ↓
Response Processing
       ↓
Visualization Rendering
```

## Core Components

### 1. Data Parser (`/lib/parser/`)
- `cricsheet-parser.ts` - Main YAML/JSON parser
- `validator.ts` - Schema validation
- `enricher.ts` - Data enrichment
- `calculator.ts` - Derived metrics

### 2. Analytics Engine (`/lib/analytics/`)
- `stats-calculator.ts` - Statistical computations
- `query-engine.ts` - Complex query handling
- `aggregator.ts` - Data aggregation
- `insights-generator.ts` - Pattern detection

### 3. API Layer (`/app/api/`)
- `/upload` - File upload endpoint
- `/matches` - Match queries
- `/players` - Player statistics
- `/teams` - Team analytics
- `/leaderboards` - Rankings
- `/insights` - Auto-generated insights

### 4. Frontend Components (`/components/`)
- `Dashboard/` - Main dashboards
- `Visualizations/` - Charts (wagon wheel, manhattan, etc.)
- `QueryBuilder/` - Advanced filtering
- `PlayerProfile/` - Player pages
- `MatchView/` - Match analysis
- `Insights/` - Insights display

## Key Design Decisions

### Match ID Format
```
{format}_{team1}_vs_{team2}_{date}_{venue}
Example: t20_india_vs_australia_20240115_mumbai
```

### Player Identification
- Use Cricsheet's player registry IDs
- Maintain name variations mapping
- Handle historical name changes

### Denormalization Strategy
- Store computed stats with raw data
- Trade storage for query performance
- Rebuild aggregations on demand

### Caching Strategy
- Edge Config: Static leaderboards
- Redis/Vercel KV: Query results
- SWR: Client-side caching
- TTL: 5 minutes for live data, 1 hour for historical

### Performance Optimization
1. **Lazy Loading:** Load match details on demand
2. **Pagination:** Limit query results
3. **Indexing:** Firestore composite indexes
4. **Pre-computation:** Common queries
5. **CDN:** Static assets

## Analysis Dimensions

### 8 Core Dimensions
1. **Time:** Date ranges, seasons, career phases
2. **Players:** Individual performance, matchups
3. **Teams:** Team performance, head-to-head
4. **Venues:** Ground characteristics, player records
5. **Format:** Test, ODI, T20, leagues
6. **Match Phase:** Powerplay, middle, death
7. **Match Context:** Toss, captaincy, situation
8. **Competition:** Tournaments, series

### Query Combinations
Support filtering across ANY combination of dimensions:
- "Virat Kohli in IPL 2016-2020, batting at #3, successful chases, away venues"
- "Teams defending <150 in T20s in last 5 years"
- "Bumrah vs Starc in death overs (16-20) in ODIs at neutral venues"

## Insights Engine

### Auto-Generated Insights
1. **Records & Milestones**
   - Fastest to X runs/wickets
   - Highest scores at venues
   - Best bowling figures

2. **Trends & Patterns**
   - Consecutive performances
   - Seasonal variations
   - Venue tendencies

3. **Anomalies & Outliers**
   - Unusual performances
   - Statistical aberrations
   - Historical anomalies

4. **Correlations**
   - Toss impact
   - Partnership effects
   - Phase correlations

5. **Predictive Warnings**
   - Historical struggles
   - Venue-specific challenges
   - Form predictions

## Visualization Types

### Cricket-Specific
- **Wagon Wheel:** Shot distribution
- **Pitch Map:** Bowling zones
- **Manhattan Chart:** Over-by-over runs
- **Beehive:** Ball-by-ball runs
- **Worm Chart:** Match progression

### Standard Analytics
- Line charts (career progression)
- Bar charts (venue comparison)
- Pie charts (dismissal types)
- Scatter plots (SR vs Avg)
- Heatmaps (effectiveness zones)
- Radar charts (multi-attribute comparison)

## Security & Privacy

### Data Access Control
- Public: Match data, aggregated statistics
- Admin: Upload functionality, data management
- Rate limiting on API endpoints
- Input validation and sanitization

### Firebase Security Rules
```javascript
// Matches: Read-only for all, write for admins
// Players: Read-only for all
// Leaderboards: Read-only for all
// Uploads: Admin only
```

## Scalability Considerations

### Data Volume
- ~50,000+ matches (Cricsheet total)
- ~30,000 players
- ~500 venues
- ~10M+ deliveries

### Query Optimization
- Firestore composite indexes
- Query result caching
- Pagination for large datasets
- Background aggregation jobs

### Cost Management
- Free tier: 50K reads/day
- Cache frequently accessed data
- Batch write operations
- Optimize query patterns

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Project setup
- Database schema
- Data parser
- Basic upload functionality

### Phase 2: Core Analytics (Weeks 3-4)
- Statistics calculator
- Query engine
- Player/Team/Match APIs
- Basic dashboards

### Phase 3: Visualizations (Weeks 5-6)
- Chart components
- Interactive visualizations
- Match view
- Player profiles

### Phase 4: Advanced Features (Weeks 7-8)
- Query builder
- Insights engine
- Leaderboards
- Comparative analysis

### Phase 5: Polish & Optimization (Weeks 9-10)
- Performance tuning
- Mobile responsiveness
- SEO optimization
- Documentation

## Deployment

### Vercel Deployment
- Automatic deployments from git
- Edge functions for API routes
- CDN for static assets
- Environment variables for Firebase config

### CI/CD Pipeline
- GitHub Actions
- Automated testing
- Build optimization
- Database backups

## Monitoring & Analytics

### Application Monitoring
- Vercel Analytics
- Error tracking (Sentry)
- Performance monitoring
- User behavior analytics

### Data Quality
- Validation logs
- Import success rates
- Data completeness metrics
- Anomaly detection

## Future Enhancements

### Advanced Features
- Machine learning predictions
- Real-time match tracking
- Video analysis integration
- Social sharing features
- Export to PDF/Excel
- Custom report builder
- API for third-party access
- Mobile apps (React Native)

### Data Sources
- Add player photos/profiles
- Integrate news/articles
- Weather data correlation
- Pitch reports
- Player fitness data
