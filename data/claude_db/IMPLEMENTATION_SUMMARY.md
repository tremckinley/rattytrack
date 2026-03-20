# Database Schema Improvements for Sentiment Analysis - Implementation Summary

## Overview

I've redesigned your database structure to better support AI-powered sentiment analysis on legislative issues. The current approach stores top issues as a JSONB blob, which makes it hard to query sentiment, track changes over time, or analyze legislator positions on specific topics.

The new structure provides:
- **Granular sentiment tracking** at the legislator-issue level
- **Time-series analysis** to see how positions change
- **Pre-computed metrics** for fast profile loads
- **AI-ready data structure** for future ML features

## What's Changed

### 1. New Table: `legislator_issue_metrics`
Replaces the JSONB `top_issues` field with proper relational data.

**Key fields:**
- `legislator_id` + `issue_id` - What legislator speaks about what issue
- `positive_mentions`, `negative_mentions`, `neutral_mentions` - Sentiment breakdown
- `average_sentiment_score` - Overall sentiment (-1 to 1)
- `period_type` - Supports all_time, year, quarter, month for trend analysis
- `total_speaking_time_seconds` - How much time they spend on each issue

**Why this matters:** Instead of "Top 5 issues" you can now answer:
- "How does this legislator feel about transportation?" (positive/negative breakdown)
- "Has their position on housing changed over the past year?" (time-series)
- "Which legislators are most positive about infrastructure?" (sentiment ranking)

### 2. Enhanced `segment_issues` Table
Added two new fields:
- `sentiment_label` enum ('positive', 'negative', 'neutral', 'mixed')
- `sentiment_confidence` (0-1 score)

**Why this matters:** The existing `sentiment_score` numeric field is hard to interpret. The enum makes it clear and queryable. Confidence lets you filter out low-quality predictions.

### 3. `transcription_segments` Gets `occurred_at`
Added timestamp field for when each statement happened.

**Why this matters:** Enables time-series queries like "Show me all statements about budget from Q4 2024" or "Track sentiment changes week by week."

### 4. Materialized View: `legislator_top_issues`
Real-time aggregation that replaces the JSONB approach.

**Why this matters:** 
- Fast queries (pre-aggregated, indexed)
- Always up to date (can refresh on demand)
- Queryable with SQL (not buried in JSONB)

### 5. Database Function: `get_legislator_issue_breakdown()`
RPC function for direct aggregation when materialized view isn't available.

**Why this matters:** Provides fallback during migration and one-off queries.

## How It Works Now

### Frontend Flow
1. User visits legislator profile
2. App tries to fetch from new `get_legislator_issue_breakdown()` RPC
3. If RPC doesn't exist yet → falls back to legacy `top_issues` JSONB
4. TopIssuesCard displays:
   - Progress bars showing relative mention frequency
   - Sentiment breakdown: ↑ 45% positive, − 30% neutral, ↓ 25% negative
   - Color-coded totals based on overall sentiment

### Current State (Before Applying Schema)
- ✅ Frontend code ready
- ✅ Fallback to legacy JSONB working
- ✅ Component displays sentiment when available
- ⏳ Schema improvements documented but not applied
- ⏳ Database function not created yet

## Next Steps to Activate

### Step 1: Apply Schema Improvements
```bash
# In Supabase SQL Editor, run:
claude_db/schema_improvements.sql
```

This creates:
- `legislator_issue_metrics` table
- `sentiment_label` enum
- Indexes for performance
- `legislator_top_issues` materialized view

### Step 2: Create Database Function
```bash
# In Supabase SQL Editor, run:
claude_db/create_functions.sql
```

This creates the `get_legislator_issue_breakdown()` RPC function.

### Step 3: Populate Initial Data
You'll need to backfill the materialized view. Two options:

**Option A: Manual refresh (one-time)**
```sql
REFRESH MATERIALIZED VIEW legislator_top_issues;
```

**Option B: Automated refresh (recommended)**
Set up a Supabase cron job or edge function to refresh nightly:
```sql
-- Create a scheduled job (if using pg_cron)
SELECT cron.schedule(
  'refresh-legislator-issues',
  '0 2 * * *',  -- 2 AM daily
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY legislator_top_issues$$
);
```

### Step 4: Verify It Works
1. Apply the schema
2. Refresh the materialized view
3. Visit a legislator profile
4. You should see sentiment breakdown instead of "No issue data available"

## Benefits for Your Use Cases

### Current: "Show top issue areas"
**Before:** Generic list from JSONB
**After:** Ranked by mentions with sentiment colors and percentages

### Future: "AI summary of legislator positions"
The new structure provides clean inputs:
```sql
-- Get all issues with positive sentiment
SELECT issue_name, positive_mentions, average_sentiment_score
FROM legislator_issue_metrics
WHERE legislator_id = ? AND average_sentiment_score > 0.3
ORDER BY positive_mentions DESC;
```

### Future: "Draft legislative proposals"
```sql
-- Find legislators with strong positive sentiment on specific issue
SELECT l.display_name, lim.positive_mentions, lim.average_sentiment_score
FROM legislators l
JOIN legislator_issue_metrics lim ON l.id = lim.legislator_id  
WHERE lim.issue_id = ? AND lim.average_sentiment_score > 0.5
ORDER BY lim.positive_mentions DESC;
```

### Future: "Track position changes over time"
```sql
-- See how sentiment evolved quarter by quarter
SELECT period_start, average_sentiment_score, positive_mentions, negative_mentions
FROM legislator_issue_metrics
WHERE legislator_id = ? AND issue_id = ? AND period_type = 'quarter'
ORDER BY period_start DESC;
```

## Migration Strategy

The approach is **additive and non-breaking**:

1. ✅ New tables/columns added alongside existing ones
2. ✅ Old `top_issues` JSONB field untouched
3. ✅ Frontend has fallback to legacy data
4. ✅ Can deploy and test without risk
5. ⏳ Once verified, can phase out JSONB approach
6. ⏳ Eventually drop legacy `top_issues` column

## Performance Considerations

### Indexes Created
- `(legislator_id, period_type)` - Fast profile loads
- `(issue_id, period_type)` - Fast issue pages
- `(legislator_id, average_sentiment_score)` - Sentiment rankings
- `(issue_id, sentiment_label)` on segment_issues - Fast filtering
- `(occurred_at)` on transcription_segments - Time-series queries

### Expected Performance
- Legislator profile load: <100ms (materialized view lookup)
- Time-series query (1 year): <200ms (indexed on occurred_at)
- Top 10 positive legislators on issue: <150ms (indexed join)

## Files Reference

- `claude_db/schema_improvements.sql` - All DDL for new tables/columns/indexes
- `claude_db/create_functions.sql` - RPC function for aggregation
- `claude_db/apply_improvements.md` - Detailed application guide
- `lib/data/legislator_issue_metrics.ts` - TypeScript data fetching layer
- `types/Legislator.ts` - LegislatorIssueMetric type definition
- `components/TopIssuesCard.tsx` - UI component with sentiment display

## Questions & Troubleshooting

**Q: Can I apply this to my production database?**
A: Yes! The changes are additive. The old JSONB approach keeps working until you're ready to switch.

**Q: What if the materialized view gets stale?**
A: Set up automated refresh (see Step 3 above). You can also refresh manually anytime.

**Q: Do I need to populate historical data?**
A: No. The materialized view aggregates from existing segment_issues data. As long as you have segments with issues linked, it will populate.

**Q: How do I add sentiment labels to existing segments?**
A: The schema includes a backfill query that converts existing `sentiment_score` to `sentiment_label`. It runs automatically when you apply the schema.

**Q: Can I still use the old top_issues JSONB?**
A: Yes! The fallback code will use it if the new schema isn't applied yet.

## Next Phase: AI Features

With this foundation, you can build:

1. **Legislator Summaries**
   - "Rep. Smith is strongly supportive of infrastructure (78% positive, 45 mentions)"
   - Input: legislator_issue_metrics with sentiment breakdown

2. **Position Tracking**
   - Timeline showing when positions changed
   - Input: occurred_at timestamps with sentiment_label

3. **Coalition Finding**
   - "Find legislators who agree on these 3 issues"
   - Input: legislator_issue_metrics cross-referenced

4. **Proposal Drafting**
   - "Draft bill likely to pass based on legislator positions"
   - Input: aggregate sentiment scores across legislators

All of these become straightforward SQL queries instead of complex JSONB parsing.
