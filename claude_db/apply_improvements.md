# Database Schema Improvements - Application Guide

## Overview
These improvements shift from storing top issues as JSONB to a proper relational structure that tracks sentiment at the legislator-issue level. This enables:

1. **Better sentiment analysis** - Track positive/negative/neutral breakdown per issue
2. **Time-series analysis** - See how legislator positions change over time
3. **Faster queries** - Pre-computed metrics instead of complex aggregations
4. **AI-ready data** - Structured format for future ML features

## How to Apply

### Option 1: Via Supabase Dashboard SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `claude_db/schema_improvements.sql`
5. Paste and run the query
6. Check for any errors in the output

### Option 2: Via Supabase CLI
```bash
supabase db push
```

### Option 3: Manual Review
The SQL file is safe to run multiple times (uses IF NOT EXISTS) and includes:
- New `legislator_issue_metrics` table
- `occurred_at` timestamp on segments  
- `sentiment_label` enum for clearer categorization
- Performance indexes
- Materialized view for fast top issues queries

## What Changes

### New Table: `legislator_issue_metrics`
Replaces the JSONB `top_issues` field with proper relational data:
- **Before**: `legislator_statistics.top_issues` JSONB blob
- **After**: Separate row per legislator-issue with sentiment breakdown

### Enhanced Sentiment Tracking
- **sentiment_label**: enum ('positive', 'negative', 'neutral', 'mixed')
- **sentiment_confidence**: 0-1 score for prediction confidence
- Separate counts for positive/negative/neutral mentions

### Time-Series Support
- `occurred_at` timestamp on segments enables trend analysis
- Period-based metrics (all_time, year, quarter, month)

## Next Steps After Applying

1. **Populate initial metrics** - Run aggregation to fill legislator_issue_metrics
2. **Schedule refresh** - Set up nightly/hourly refresh of materialized view
3. **Update frontend** - Fetch from new tables instead of JSONB fields
4. **Monitor performance** - Check query times improve with new indexes

## Migration Strategy

The schema changes are **additive** - they don't break existing functionality:
- Old `top_issues` JSONB field remains untouched
- New tables/columns are added alongside
- Can gradually migrate frontend to use new structure
- Once verified, can deprecate JSONB approach

## Rollback Plan

If needed, simply drop the new objects:
```sql
DROP MATERIALIZED VIEW IF EXISTS public.legislator_top_issues CASCADE;
DROP TABLE IF EXISTS public.legislator_issue_metrics CASCADE;
ALTER TABLE public.segment_issues DROP COLUMN IF EXISTS sentiment_label;
ALTER TABLE public.segment_issues DROP COLUMN IF EXISTS sentiment_confidence;
ALTER TABLE public.transcription_segments DROP COLUMN IF EXISTS occurred_at;
```
