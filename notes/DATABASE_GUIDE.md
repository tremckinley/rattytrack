# CapyTrackAI Database Guide

> **Purpose**: This guide documents the database structure for building AI-powered sentiment analysis features. It clearly separates what's currently implemented from what's planned for future enhancements.

---

## Table of Contents

1. [Overview](#overview)
2. [Current Database Schema](#current-database-schema)
3. [Core Tables Reference](#core-tables-reference)
4. [Table Relationships](#table-relationships)
5. [Data Access Functions](#data-access-functions)
6. [Planned Sentiment Analysis Enhancements](#planned-sentiment-analysis-enhancements)
7. [Common Query Patterns](#common-query-patterns)
8. [AI Integration Examples](#ai-integration-examples)

---

## Overview

### What This System Does

CapyTrackAI tracks legislative activity by:
1. **Transcribing** city council meetings from YouTube videos (OpenAI Whisper API)
2. **Identifying** which legislator said what (speaker attribution)
3. **Categorizing** statements by issue (transportation, housing, etc.)
4. **Analyzing** sentiment (positive, negative, neutral positions)
5. **Aggregating** metrics for legislator profiles and dashboards

### Technology Stack

- **Database**: PostgreSQL (hosted on Supabase)
- **Client Library**: `@supabase/supabase-js`
- **Full-text Search**: PostgreSQL `tsvector` indexes
- **Real-time**: Supabase Realtime (for live updates)
- **Row Level Security**: RLS policies for public/private data

### Current Status

✅ **Working Now**:
- YouTube video transcription pipeline
- Uploaded meeting video processing
- Legislator profiles with basic stats
- Issue categorization (basic)
- Full-text search across transcripts

⏳ **Planned** (requires SQL schema application):
- Detailed sentiment analysis (positive/negative/neutral breakdown)
- Time-series tracking of position changes
- Legislator-issue metrics aggregation
- Materialized views for fast queries

---

## Current Database Schema

The code currently queries these tables. Some are defined in local SQL files, others likely exist in production Supabase but aren't in the repository.

### Tables Used by Application Code

| Table Name | Source | Status | Purpose |
|-----------|--------|--------|---------|
| `legislators` | Production | ✅ Active | Council member profiles |
| `legislator_statistics` | Production | ✅ Active | Pre-computed stats per legislator |
| `meetings` | Production | ✅ Active | Scheduled council meetings |
| `transcription_segments` | Production | ✅ Active | Individual statements with timestamps |
| `issues` | Production | ✅ Active | Topics discussed (housing, transit, etc.) |
| `segment_issues` | Production | ✅ Active | Links segments to issues with relevance |
| `uploaded_meetings` | `claude_db/meeting_uploads_schema.sql` | ✅ Active | User-uploaded video files |
| `uploaded_meeting_segments` | `claude_db/meeting_uploads_schema.sql` | ✅ Active | Segments from uploaded videos |
| `youtube_transcriptions` | Code-referenced | ✅ Active | YouTube video transcription records |
| `youtube_transcript_segments` | Code-referenced | ✅ Active | Segments from YouTube videos |
| `legislator_top_issues` (view) | `claude_db/schema_improvements.sql` | ⏳ Planned | Materialized view for fast top issues |
| `legislator_issue_metrics` | `claude_db/schema_improvements.sql` | ⏳ Planned | Sentiment breakdown per legislator-issue |

**Note**: Tables without a SQL file reference are assumed to exist in production Supabase. You can verify by checking your Supabase dashboard → Database → Tables.

---

## Core Tables Reference

### 1. `legislators`

**Purpose**: Stores information about each city council member.

**Columns** (based on TypeScript type in `types/Legislator.ts`):
```typescript
id: string                           // UUID
legislative_body_id: string          // Which council/body
first_name: string
last_name: string
display_name: string                 // "John Smith"
title: string | null                 // "Council Member"
district: string | null              // "Super District 9 Position 2"
party_affiliation: string | null     // "Nonpartisan"
email: string | null
phone: string | null
office_address: string | null
photo_url: string | null             // Profile picture URL
website_url: string | null
social_media: object | null          // {twitter: "@handle", ...}
date_of_birth: string | null         // ISO date
gender: string | null
race_ethnicity: string | null
education: string | null
occupation: string | null
term_start: string | null            // ISO date
term_end: string | null              // ISO date
is_active: boolean                   // Currently serving
voice_profile_id: string | null      // For AI speaker identification
face_profile_id: string | null       // For video recognition
bio: string | null
metadata: object | null              // Extra data (JSONB)
committees: string[] | null          // Committee memberships
created_at: string                   // ISO timestamp
updated_at: string                   // ISO timestamp
```

**Used By**:
- `lib/data/legislators/legislator_card.ts` → List view
- `lib/data/legislators/legislator.ts` → Single legislator
- `lib/data/legislators/legislator_profile.ts` → Full profile with stats

---

### 2. `legislator_statistics`

**Purpose**: Pre-computed aggregate stats for each legislator.

**Columns** (based on TypeScript type in `types/Legislator.ts`):
```typescript
id: string
legislator_id: string                // Foreign key → legislators
period_type: string                  // 'all_time' | 'year' | 'session'
period_start: string                 // ISO date
period_end: string                   // ISO date
meetings_attended: number
meetings_missed: number
total_segments: number               // How many times they spoke
total_speaking_time_seconds: number
average_segment_length_seconds: number
bills_sponsored: number
bills_cosponsored: number
votes_cast: number
votes_yes: number
votes_no: number
votes_abstain: number
motions_made: number
average_sentiment: number            // -1 to 1 scale
top_issues: string[] | null          // Legacy field (will be replaced)
last_calculated_at: string           // ISO timestamp
created_at: string
```

**Used By**:
- `lib/data/legislators/legislator_profile.ts` → Profile page stats

**Note**: The `top_issues` JSONB array is legacy and will be replaced by the `legislator_issue_metrics` table (planned enhancement).

---

### 3. `meetings`

**Purpose**: Tracks city council meetings, committee sessions, and hearings.

**Columns** (inferred from code usage):
```typescript
id: string                           // UUID
title: string
description: string | null
scheduled_start: string              // ISO timestamp
scheduled_end: string | null
location: string | null
meeting_type: string | null          // "Regular", "Special", etc.
video_url: string | null             // YouTube or other
created_at: string
updated_at: string
```

**Used By**:
- `lib/data/legislators/legislator_statements.ts` → Shows which meeting a statement was from

---

### 4. `transcription_segments`

**Purpose**: Individual statements from meetings, broken down sentence-by-sentence.

**Columns** (inferred from code usage):
```typescript
id: string                           // UUID
meeting_id: string | null            // Foreign key → meetings
speaker_id: string | null            // Foreign key → legislators
segment_index: number                // Order in transcript
start_time_seconds: number           // When statement begins
end_time_seconds: number             // When statement ends
text: string                         // What was said
speaker_name: string | null          // "Council Member Smith"
confidence_score: number | null      // 0-1, transcription accuracy
is_manually_verified: boolean | null
search_vector: tsvector | null       // Full-text search index
created_at: string
updated_at: string
```

**Planned Addition** (via `schema_improvements.sql`):
```typescript
occurred_at: timestamp | null        // When this statement happened
```

**Used By**:
- `lib/data/legislators/legislator_statements.ts` → Fetch legislator's recent statements

**Why This Matters**: Sentence-level granularity lets us track exactly what each legislator says and link it to specific issues.

---

### 5. `issues`

**Purpose**: Topics that legislators discuss (e.g., "Transportation", "Housing").

**Columns** (inferred from code usage):
```typescript
id: string                           // UUID
name: string                         // "Public Transportation"
slug: string                         // "public-transportation"
description: string | null
category: string | null              // "Infrastructure"
is_ai_generated: boolean | null
is_active: boolean | null
created_at: string
updated_at: string
```

**Used By**:
- `lib/data/issues.ts` → Fetch all active issues
- `lib/data/legislators/legislator_statements.ts` → Show which issues a statement discusses

---

### 6. `segment_issues`

**Purpose**: Links individual statements to the issues they discuss, with AI-generated relevance and sentiment scores.

**Columns** (inferred from code usage):
```typescript
id: string                           // UUID
segment_id: string                   // Foreign key → transcription_segments
issue_id: string                     // Foreign key → issues
relevance_score: number              // 0-1, how related
sentiment_score: number | null       // -1 to 1, overall sentiment
is_ai_generated: boolean | null
is_manually_verified: boolean | null
created_at: string
updated_at: string
```

**Planned Additions** (via `schema_improvements.sql`):
```typescript
sentiment_label: enum | null         // 'positive' | 'negative' | 'neutral' | 'mixed'
sentiment_confidence: number | null  // 0-1, confidence in classification
```

**Used By**:
- `lib/data/legislators/legislator_statements.ts` → Show which issues each statement discusses

**How It Works**: When a legislator says "I believe we need to invest more in public transportation," the AI:
1. Detects this relates to "Public Transportation" (`relevance_score: 0.95`)
2. Classifies sentiment as positive (`sentiment_score: 0.7`)
3. Stores it in this table

---

### 7. `uploaded_meetings`

**Purpose**: User-uploaded video files for transcription.

**Columns** (from `claude_db/meeting_uploads_schema.sql`):
```sql
id                      UUID PRIMARY KEY
title                   VARCHAR(500)
description             TEXT
video_filename          VARCHAR(500) NOT NULL
video_size_bytes        BIGINT NOT NULL
video_duration_seconds  NUMERIC(10, 2)
video_language          VARCHAR(10)
full_transcript         TEXT
transcription_status    VARCHAR(50) DEFAULT 'pending'
                        -- 'pending' | 'processing' | 'completed' | 'failed'
transcription_error     TEXT
uploaded_by_user_id     UUID
uploaded_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
processed_at            TIMESTAMP WITH TIME ZONE
search_vector           TSVECTOR (generated column)
is_active               BOOLEAN DEFAULT TRUE
```

**Used By**:
- `lib/data/uploaded_meetings.ts` → Fetch, create, update uploaded meetings

---

### 8. `uploaded_meeting_segments`

**Purpose**: Timestamped transcript segments from uploaded videos.

**Columns** (from `claude_db/meeting_uploads_schema.sql`):
```sql
id                    UUID PRIMARY KEY
uploaded_meeting_id   UUID NOT NULL REFERENCES uploaded_meetings(id)
segment_index         INTEGER NOT NULL
start_time_seconds    NUMERIC(10, 2) NOT NULL
end_time_seconds      NUMERIC(10, 2) NOT NULL
text                  TEXT NOT NULL
speaker_name          VARCHAR(255)
speaker_id            UUID (references legislators)
search_vector         TSVECTOR (generated column)
```

**Used By**:
- `lib/data/uploaded_meetings.ts` → Fetch segments for a specific meeting

---

### 9. `youtube_transcriptions`

**Purpose**: Tracks YouTube videos that have been transcribed.

**Columns** (inferred from code usage in `lib/data/youtube_transcriptions.ts`):
```typescript
id: string                           // UUID
video_id: string                     // YouTube video ID (e.g., "dQw4w9WgXcQ")
title: string
channel_title: string
published_at: string                 // ISO timestamp
duration: number                     // seconds
thumbnail_url: string
status: string                       // 'processing' | 'completed' | 'error'
error_message: string | null
cost: number | null                  // OpenAI API cost in USD
created_at: string
updated_at: string
```

**Used By**:
- `lib/data/youtube_transcriptions.ts` → Create, update, fetch transcriptions
- `app/api/transcribe/youtube/route.ts` → Transcription API

---

### 10. `youtube_transcript_segments`

**Purpose**: Timestamped segments from YouTube video transcriptions.

**Columns** (inferred from code usage):
```typescript
id: string                           // UUID
video_id: string                     // Foreign key → youtube_transcriptions
start_time: number                   // seconds
end_time: number                     // seconds
text: string
segment_index: number | null
created_at: string
```

**Used By**:
- `lib/data/youtube_transcriptions.ts` → Save and fetch transcript segments

---

## Table Relationships

### Visual Overview

```
legislators ←─────┐
    ↓             │
    │     legislator_statistics
    │             ↓
    │      (stats for each legislator)
    ↓
transcription_segments ←──── meetings
    ↓                            ↑
    │                      (what meeting)
    ↓
segment_issues ←──────────── issues
    ↓                            ↑
(links statements           (topics discussed)
 to issues with
 sentiment scores)
```

### Key Relationships

**Legislators and Statements**:
- One legislator → Many `transcription_segments` (via `speaker_id`)
- Each segment belongs to one legislator

**Statements and Issues**:
- One segment → Many issues (statement can discuss multiple topics)
- One issue → Many segments (many people discuss the same issue)
- Linked via `segment_issues` join table

**Meetings and Transcripts**:
- One meeting → Many `transcription_segments`
- Each segment belongs to one meeting

**Uploaded Videos**:
- One `uploaded_meeting` → Many `uploaded_meeting_segments`
- One `youtube_transcription` → Many `youtube_transcript_segments`

---

## Data Access Functions

All data access functions are in `lib/data/` and use the Supabase client.

### Legislators

#### `getLegislators(status?: 'active' | 'inactive' | 'all')`
**File**: `lib/data/legislators/legislator_card.ts`

Fetches a list of legislators with optional status filtering.

**Usage**:
```typescript
import { getLegislators } from '@/lib/data/legislators/legislator_card';

// Get only active legislators (default)
const { data, error } = await getLegislators('active');

// Get former legislators
const { data, error } = await getLegislators('inactive');

// Get all legislators
const { data, error } = await getLegislators('all');
```

**Returns**: `{ data: Legislator[], error: string | null }`

**Query**:
```typescript
supabase
  .from('legislators')
  .select('*')
  .or('is_active.eq.true,is_active.is.null') // for 'active'
  // OR
  .eq('is_active', false) // for 'inactive'
  // OR no filter for 'all'
  .order('display_name', { ascending: true })
```

**Note**: Treats `is_active = null` as active for backward compatibility.

---

#### `getLegislator(id: string)`
**File**: `lib/data/legislators/legislator.ts`

Fetches a single legislator's basic info by ID.

**Usage**:
```typescript
import { getLegislator } from '@/lib/data/legislators/legislator';

const legislator = await getLegislator('abc-123');
if (legislator) {
  console.log(legislator.display_name);
}
```

**Returns**: `Legislator | null`

**Query**:
```typescript
supabase
  .from('legislators')
  .select()
  .eq('id', id)
  .single()
```

---

#### `getLegislatorProfile(id: string)`
**File**: `lib/data/legislators/legislator_profile.ts`

Fetches a legislator's complete profile including statistics.

**Usage**:
```typescript
import { getLegislatorProfile } from '@/lib/data/legislators/legislator_profile';

const profile = await getLegislatorProfile('abc-123');
if (profile?.stats) {
  console.log('Total speaking time:', profile.stats[0].total_speaking_time_seconds);
}
```

**Returns**: `Legislator | null` (with `stats` array populated)

**Query**:
```typescript
supabase
  .from('legislators')
  .select(`
    *,
    stats:legislator_statistics(*)
  `)
  .eq('id', id)
  .single()
```

---

#### `getLegislatorStatements(legislatorId: string)`
**File**: `lib/data/legislators/legislator_statements.ts`

Fetches a legislator's recent statements with associated issues and meeting info.

**Usage**:
```typescript
import { getLegislatorStatements } from '@/lib/data/legislators/legislator_statements';

const statements = await getLegislatorStatements('abc-123');
statements.forEach(stmt => {
  console.log(`On ${stmt.meeting_date}: "${stmt.text}"`);
  stmt.issues.forEach(issue => {
    console.log(`  - ${issue.issue_name} (relevance: ${issue.relevance_score})`);
  });
});
```

**Returns**: `StatementWithIssue[]`

**Type**:
```typescript
type StatementWithIssue = {
  id: string;
  text: string;
  start_time_seconds: number;
  end_time_seconds: number;
  meeting_date: string;
  meeting_title: string;
  meeting_id: string;
  issues: Array<{
    issue_name: string;
    issue_slug: string;
    relevance_score: number;
  }>;
};
```

**Queries** (two separate calls):
```typescript
// 1. Get segments
supabase
  .from('transcription_segments')
  .select(`
    id, text, start_time_seconds, end_time_seconds,
    meeting:meetings(id, title, scheduled_start)
  `)
  .eq('speaker_id', legislatorId)
  .order('start_time_seconds', { ascending: false })
  .limit(50)

// 2. Get issues for those segments
supabase
  .from('segment_issues')
  .select(`
    segment_id, relevance_score,
    issue:issues(name, slug)
  `)
  .in('segment_id', segmentIds)
```

**Limit**: Most recent 50 statements

---

### Issue Metrics & Sentiment

#### `getLegislatorIssueMetrics(legislatorId: string, limit?: number)`
**File**: `lib/data/legislator_issue_metrics.ts`

Fetches sentiment breakdown for a legislator's top issues.

**Usage**:
```typescript
import { getLegislatorIssueMetrics } from '@/lib/data/legislator_issue_metrics';

const metrics = await getLegislatorIssueMetrics('abc-123', 10);
metrics.forEach(m => {
  const positivePercent = (m.positive_mentions / m.total_mentions) * 100;
  console.log(`${m.issue_name}: ${positivePercent.toFixed(0)}% positive`);
  console.log(`  Total mentions: ${m.total_mentions}`);
  console.log(`  Sentiment score: ${m.average_sentiment_score.toFixed(2)}`);
});
```

**Returns**: `LegislatorIssueMetric[]`

**Type**:
```typescript
type LegislatorIssueMetric = {
  issue_id: string;
  issue_name: string;
  total_mentions: number;
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  average_sentiment_score: number; // -1 to 1
  total_speaking_time_seconds: number;
};
```

**Query**:
```typescript
supabase
  .from('legislator_top_issues') // Materialized view
  .select(`
    issue_id, mention_count, total_speaking_time_seconds,
    avg_sentiment, positive_count, negative_count, neutral_count,
    issues:issue_id(name)
  `)
  .eq('legislator_id', legislatorId)
  .order('mention_count', { ascending: false })
  .limit(limit)
```

**⚠️ Note**: This requires the `legislator_top_issues` materialized view from `schema_improvements.sql`. If not applied, this will return empty results.

---

#### `getLegislatorIssueMetricsDirect(legislatorId: string, limit?: number)`
**File**: `lib/data/legislator_issue_metrics.ts`

Fallback function using RPC for direct aggregation.

**Usage**:
```typescript
// Use this if getLegislatorIssueMetrics returns empty
const metrics = await getLegislatorIssueMetricsDirect('abc-123', 10);
```

**Query**:
```typescript
supabase.rpc('get_legislator_issue_breakdown', {
  p_legislator_id: legislatorId,
  p_limit: limit
})
```

**⚠️ Note**: Requires the RPC function from `claude_db/create_functions.sql`. Won't work until that's applied.

---

### Meetings & Transcripts

#### `getUploadedMeetings(limit?: number)`
**File**: `lib/data/uploaded_meetings.ts`

Fetches list of uploaded meeting videos.

**Usage**:
```typescript
import { getUploadedMeetings } from '@/lib/data/uploaded_meetings';

const meetings = await getUploadedMeetings(50);
meetings.forEach(m => {
  console.log(`${m.title}: ${m.transcription_status}`);
});
```

**Returns**: `UploadedMeeting[]`

**Query**:
```typescript
supabase
  .from('uploaded_meetings')
  .select('*')
  .eq('is_active', true)
  .order('uploaded_at', { ascending: false })
  .limit(limit)
```

---

#### `getCompletedUploadedMeetings(limit?: number)`
**File**: `lib/data/uploaded_meetings.ts`

Fetches only successfully transcribed meetings.

**Usage**:
```typescript
const completed = await getCompletedUploadedMeetings(20);
```

**Returns**: `UploadedMeeting[]` (only where `transcription_status = 'completed'`)

---

#### `getUploadedMeetingWithSegments(meetingId: string)`
**File**: `lib/data/uploaded_meetings.ts`

Fetches a meeting with all its transcript segments.

**Usage**:
```typescript
import { getUploadedMeetingWithSegments } from '@/lib/data/uploaded_meetings';

const { meeting, segments } = await getUploadedMeetingWithSegments('upload-222');
if (meeting) {
  console.log(`Title: ${meeting.title}`);
  segments.forEach(seg => {
    console.log(`[${seg.start_time_seconds}s] ${seg.speaker_name}: ${seg.text}`);
  });
}
```

**Returns**: `{ meeting: UploadedMeeting | null, segments: UploadedMeetingSegment[] }`

---

#### `searchUploadedTranscripts(query: string, limit?: number)`
**File**: `lib/data/uploaded_meetings.ts`

Full-text search across all uploaded transcripts.

**Usage**:
```typescript
import { searchUploadedTranscripts } from '@/lib/data/uploaded_meetings';

const results = await searchUploadedTranscripts('budget deficit', 20);
results.forEach(r => {
  console.log(`Found in "${r.meeting_title}": "${r.segment_text}"`);
  console.log(`Speaker: ${r.speaker_name} at ${r.start_time_seconds}s`);
});
```

**Query**: Uses the `search_uploaded_transcripts` database function (from `meeting_uploads_schema.sql`)

---

### YouTube Transcriptions

#### `getTranscription(videoId: string)`
**File**: `lib/data/youtube_transcriptions.ts`

Checks if a YouTube video has been transcribed.

**Usage**:
```typescript
import { getTranscription } from '@/lib/data/youtube_transcriptions';

const existing = await getTranscription('dQw4w9WgXcQ');
if (existing) {
  console.log('Status:', existing.status);
} else {
  console.log('Not yet transcribed');
}
```

**Returns**: `YouTubeTranscription | null`

---

#### `createTranscription(data)`
**File**: `lib/data/youtube_transcriptions.ts`

Creates a new transcription record.

**Usage**:
```typescript
import { createTranscription } from '@/lib/data/youtube_transcriptions';

const record = await createTranscription({
  videoId: 'dQw4w9WgXcQ',
  title: 'City Council Meeting',
  channelTitle: 'Memphis City Council',
  publishedAt: '2024-11-15T10:00:00Z',
  duration: 7200,
  thumbnailUrl: 'https://...'
});
```

**Auto-checks**: Won't create duplicates; returns existing record if found.

---

#### `updateTranscriptionStatus(videoId, status, errorMessage?)`
**File**: `lib/data/youtube_transcriptions.ts`

Updates transcription status.

**Usage**:
```typescript
await updateTranscriptionStatus('dQw4w9WgXcQ', 'processing');
await updateTranscriptionStatus('dQw4w9WgXcQ', 'completed');
await updateTranscriptionStatus('dQw4w9WgXcQ', 'error', 'API timeout');
```

---

#### `saveTranscriptSegments(videoId, segments, cost?)`
**File**: `lib/data/youtube_transcriptions.ts`

Saves segments and marks transcription as complete.

**Usage**:
```typescript
const segments = [
  { start: 0, end: 5.2, text: 'Good morning everyone.' },
  { start: 5.2, end: 10.8, text: 'Let us begin the meeting.' }
];

await saveTranscriptSegments('dQw4w9WgXcQ', segments, 0.72);
```

---

### Issues

#### `getIssues()`
**File**: `lib/data/issues.ts`

Fetches all active issues.

**Usage**:
```typescript
import { getIssues } from '@/lib/data/issues';

const issues = await getIssues();
issues.forEach(issue => {
  console.log(`${issue.name} (${issue.slug})`);
});
```

**Returns**: `Issue[]`

**Query**:
```typescript
supabase
  .from('issues')
  .select('*')
  .eq('is_active', true)
  .order('name', { ascending: true })
```

---

## Planned Sentiment Analysis Enhancements

The following schema improvements are documented in `claude_db/schema_improvements.sql` but **not yet applied**.

### New Table: `legislator_issue_metrics`

**Purpose**: Replaces the JSONB `top_issues` field with proper relational data for sentiment tracking.

**Columns**:
```sql
id                           UUID PRIMARY KEY
legislator_id                UUID REFERENCES legislators(id)
issue_id                     UUID REFERENCES issues(id)
period_type                  VARCHAR  -- 'all_time', 'year', 'quarter', 'month'
period_start                 DATE
period_end                   DATE
total_mentions               INTEGER DEFAULT 0
total_speaking_time_seconds  INTEGER DEFAULT 0
average_relevance_score      NUMERIC
positive_mentions            INTEGER DEFAULT 0
negative_mentions            INTEGER DEFAULT 0
neutral_mentions             INTEGER DEFAULT 0
average_sentiment_score      NUMERIC  -- -1 to 1 scale
sentiment_confidence         NUMERIC  -- 0 to 1 scale
last_calculated_at           TIMESTAMP WITH TIME ZONE
created_at                   TIMESTAMP WITH TIME ZONE
```

**What This Enables**:
- "How does this legislator feel about transportation?" → Positive/negative breakdown
- "Has their position on housing changed over time?" → Compare quarterly metrics
- "Which legislators are most supportive of infrastructure?" → Sentiment ranking

---

### Enhanced `segment_issues` Table

**New Columns**:
```sql
sentiment_label       sentiment_label  -- ENUM: 'positive', 'negative', 'neutral', 'mixed'
sentiment_confidence  NUMERIC          -- 0 to 1 scale
```

**Why This Matters**: The existing `sentiment_score` numeric field (-1 to 1) is hard to query. The enum makes it clear and filterable.

---

### Enhanced `transcription_segments` Table

**New Column**:
```sql
occurred_at  TIMESTAMP WITH TIME ZONE
```

**Why This Matters**: Enables time-series queries like "Show me all statements about budget from Q4 2024."

---

### Materialized View: `legislator_top_issues`

**Purpose**: Pre-aggregated top issues per legislator for fast queries.

**Columns**:
```sql
legislator_id                   UUID
issue_id                        UUID
mention_count                   INTEGER
total_speaking_time_seconds     NUMERIC
avg_relevance                   NUMERIC
avg_sentiment                   NUMERIC
positive_count                  INTEGER
negative_count                  INTEGER
neutral_count                   INTEGER
```

**Performance**: Indexed for fast lookups. Refresh nightly or on-demand.

---

### How to Apply Schema Improvements

**Step 1**: Run the schema SQL
```bash
# In Supabase SQL Editor, paste and run:
# Contents of claude_db/schema_improvements.sql
```

**Step 2**: Create database functions
```bash
# In Supabase SQL Editor, paste and run:
# Contents of claude_db/create_functions.sql
```

**Step 3**: Populate initial data
```sql
-- Refresh the materialized view
REFRESH MATERIALIZED VIEW legislator_top_issues;
```

**Step 4**: Set up automated refresh (optional)
```sql
-- Schedule nightly refresh
SELECT cron.schedule(
  'refresh-legislator-issues',
  '0 2 * * *',  -- 2 AM daily
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY legislator_top_issues$$
);
```

**Files**:
- `claude_db/schema_improvements.sql` - Main schema changes
- `claude_db/create_functions.sql` - Database functions
- `claude_db/apply_improvements.md` - Detailed guide

---

## Common Query Patterns

### Pattern 1: Find Legislators Supporting an Issue

**Goal**: Find all legislators with positive sentiment on "Public Transportation"

```typescript
const { data } = await supabase
  .from('legislator_top_issues')
  .select(`
    legislator_id,
    positive_count,
    negative_count,
    avg_sentiment,
    legislators!inner(
      display_name,
      district
    )
  `)
  .eq('issue_id', 'issue-transportation-id')
  .gte('avg_sentiment', 0.3) // Positive threshold
  .order('positive_count', { ascending: false });
```

**⚠️ Requires**: `legislator_top_issues` view from schema improvements

---

### Pattern 2: Full-Text Search for Topic

**Goal**: Search all transcripts for "affordable housing"

```typescript
const { data } = await supabase
  .rpc('search_uploaded_transcripts', {
    search_query: 'affordable housing',
    result_limit: 20
  });

data.forEach(result => {
  console.log(`${result.meeting_title} (${result.meeting_date})`);
  console.log(`Speaker: ${result.speaker_name}`);
  console.log(`"${result.segment_text}"`);
  console.log(`Time: ${result.segment_start}s`);
});
```

**✅ Currently works**: Using the function from `meeting_uploads_schema.sql`

---

### Pattern 3: Get Legislator's Top Issues

**Goal**: Show top 5 issues a legislator discusses

```typescript
import { getLegislatorIssueMetrics } from '@/lib/data/legislator_issue_metrics';

const metrics = await getLegislatorIssueMetrics('legislator-id', 5);

metrics.forEach(m => {
  const total = m.total_mentions;
  const posPercent = ((m.positive_mentions / total) * 100).toFixed(0);
  const negPercent = ((m.negative_mentions / total) * 100).toFixed(0);
  const neuPercent = ((m.neutral_mentions / total) * 100).toFixed(0);
  
  console.log(`${m.issue_name}:`);
  console.log(`  Total mentions: ${total}`);
  console.log(`  Positive: ${posPercent}% | Neutral: ${neuPercent}% | Negative: ${negPercent}%`);
  console.log(`  Overall sentiment: ${m.average_sentiment_score.toFixed(2)}`);
});
```

**⚠️ Requires**: `legislator_top_issues` view and schema improvements

---

## AI Integration Examples

### Example 1: Generate Legislator Summary

**Goal**: Create an AI-generated summary of a legislator's positions

```typescript
import { getLegislatorIssueMetrics } from '@/lib/data/legislator_issue_metrics';
import { getLegislator } from '@/lib/data/legislators/legislator';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateLegislatorSummary(legislatorId: string) {
  const legislator = await getLegislator(legislatorId);
  const metrics = await getLegislatorIssueMetrics(legislatorId, 5);
  
  if (!legislator || metrics.length === 0) {
    return 'Insufficient data for summary.';
  }
  
  // Build prompt
  const issueDescriptions = metrics.map(m => {
    const posPercent = ((m.positive_mentions / m.total_mentions) * 100).toFixed(0);
    const stance = m.average_sentiment_score > 0.3 ? 'supportive' : 
                   m.average_sentiment_score < -0.3 ? 'critical' : 'neutral';
    
    return `- ${m.issue_name}: ${m.total_mentions} mentions (${posPercent}% positive), ${stance}`;
  }).join('\n');
  
  const prompt = `Summarize ${legislator.display_name}'s legislative priorities in 2-3 sentences based on their statements:\n\n${issueDescriptions}`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a legislative analyst. Summarize concisely.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 150
  });
  
  return response.choices[0].message.content;
}
```

**Example Output**:
> "Council Member Alvin Jackson is a strong advocate for public transportation and infrastructure development, with 75% of his transit-related statements being positive. He also frequently discusses public safety with a balanced perspective, maintaining a neutral to slightly positive stance on policing reforms."

---

### Example 2: Find Coalition Partners

**Goal**: Identify legislators likely to co-sponsor a bill on a specific issue

```typescript
async function findCoalitionPartners(issueId: string, minSentiment: number = 0.5) {
  const { data } = await supabase
    .from('legislator_top_issues')
    .select(`
      legislator_id,
      mention_count,
      positive_count,
      avg_sentiment,
      legislators!inner(
        display_name,
        district,
        party_affiliation
      )
    `)
    .eq('issue_id', issueId)
    .gte('avg_sentiment', minSentiment)
    .gte('mention_count', 5) // Significant engagement
    .order('positive_count', { ascending: false });
  
  return data.map(d => ({
    name: d.legislators.display_name,
    district: d.legislators.district,
    party: d.legislators.party_affiliation,
    supportScore: d.avg_sentiment,
    mentions: d.mention_count,
    likelihood: d.avg_sentiment > 0.7 ? 'high' : 
                d.avg_sentiment > 0.5 ? 'medium' : 'low'
  }));
}

// Usage
const partners = await findCoalitionPartners('transit-issue-id', 0.5);
console.log('Potential co-sponsors:');
partners.forEach(p => {
  console.log(`${p.name} (${p.district}) - ${p.likelihood} likelihood`);
});
```

---

### Example 3: Sentiment Trend Detection

**Goal**: Detect when a legislator's position is shifting

```typescript
async function detectPositionShift(legislatorId: string, issueId: string) {
  const { data } = await supabase
    .from('legislator_issue_metrics')
    .select('*')
    .eq('legislator_id', legislatorId)
    .eq('issue_id', issueId)
    .eq('period_type', 'quarter')
    .order('period_start', { ascending: true })
    .limit(4); // Last 4 quarters
  
  if (!data || data.length < 2) {
    return { shift: 'insufficient_data' };
  }
  
  const oldSentiment = data[0].average_sentiment_score;
  const newSentiment = data[data.length - 1].average_sentiment_score;
  const change = newSentiment - oldSentiment;
  
  if (Math.abs(change) > 0.4) {
    return {
      shift: change > 0 ? 'increasingly_positive' : 'increasingly_negative',
      magnitude: Math.abs(change),
      trend: data.map(d => ({
        quarter: d.period_start,
        sentiment: d.average_sentiment_score,
        mentions: d.total_mentions
      }))
    };
  }
  
  return { shift: 'stable' };
}

// Usage
const shift = await detectPositionShift('legislator-id', 'housing-issue-id');
if (shift.shift === 'increasingly_positive') {
  console.log(`Position shifting more positive by ${shift.magnitude.toFixed(2)}`);
}
```

---

## Quick Reference

### Environment Variables
```bash
DATABASE_URL                   # PostgreSQL connection (auto-configured)
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Public API key
SUPABASE_SERVICE_ROLE_KEY      # Server-side admin key
OPENAI_API_KEY                 # For Whisper transcription
```

### Sentiment Thresholds
```typescript
// Interpreting sentiment_score (-1 to 1)
POSITIVE: score > 0.3
NEUTRAL: -0.3 <= score <= 0.3
NEGATIVE: score < -0.3

// Confidence levels
HIGH_CONFIDENCE: 0.8+
MEDIUM_CONFIDENCE: 0.5 - 0.8
LOW_CONFIDENCE: < 0.5
```

### Key SQL Functions
```sql
-- Full-text search (currently available)
search_uploaded_transcripts(query TEXT, limit INTEGER)

-- Refresh materialized view (planned, requires schema improvements)
refresh_legislator_top_issues()

-- RPC for issue breakdown (planned, requires create_functions.sql)
get_legislator_issue_breakdown(p_legislator_id UUID, p_limit INTEGER)
```

---

## Next Steps for AI Development

1. **Apply Schema Improvements**
   - Run `claude_db/schema_improvements.sql` in Supabase
   - Run `claude_db/create_functions.sql`
   - Refresh the `legislator_top_issues` view

2. **Build AI Processing Pipeline**
   - Speaker identification (match transcript names to legislators)
   - Issue classification using LLM
   - Sentiment scoring
   - Populate `legislator_issue_metrics` table

3. **Enhance Frontend**
   - Sentiment breakdown visualizations
   - Trend charts
   - Coalition suggestions
   - AI-generated summaries

4. **Advanced Features**
   - Predictive voting analysis
   - Bill drafting assistant
   - Constituent-legislator matching

---

## Documentation Files

- `claude_db/schema_notes.md` - Original schema design
- `claude_db/IMPLEMENTATION_SUMMARY.md` - Sentiment analysis overview
- `claude_db/apply_improvements.md` - Schema application guide
- `claude_db/MEETING_UPLOADS_README.md` - Upload system details
- `claude_db/rls_notes.md` - Row Level Security policies
- `types/Legislator.ts` - TypeScript type definitions
- `types/UploadedMeeting.ts` - Upload types

---

**Last Updated**: November 2024  
**Status**: Current schema documented; sentiment enhancements planned  
**Database**: PostgreSQL (Supabase)
