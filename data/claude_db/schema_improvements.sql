-- Schema improvements for better sentiment analysis and issue tracking
-- This file documents the recommended database changes

-- 1. Create legislator_issue_metrics table
-- Tracks per-legislator, per-issue statistics with sentiment breakdown
CREATE TABLE IF NOT EXISTS public.legislator_issue_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  legislator_id uuid NOT NULL,
  issue_id uuid NOT NULL,
  period_type character varying NOT NULL, -- 'all_time', 'year', 'quarter', 'month'
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Mention and engagement metrics
  total_mentions integer DEFAULT 0,
  total_speaking_time_seconds integer DEFAULT 0,
  average_relevance_score numeric,
  
  -- Sentiment breakdown
  positive_mentions integer DEFAULT 0,
  negative_mentions integer DEFAULT 0,
  neutral_mentions integer DEFAULT 0,
  average_sentiment_score numeric, -- -1 to 1 scale
  sentiment_confidence numeric, -- 0 to 1 scale
  
  -- Metadata
  last_calculated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT legislator_issue_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT legislator_issue_metrics_legislator_id_fkey FOREIGN KEY (legislator_id) 
    REFERENCES public.legislators(id) ON DELETE CASCADE,
  CONSTRAINT legislator_issue_metrics_issue_id_fkey FOREIGN KEY (issue_id) 
    REFERENCES public.issues(id) ON DELETE CASCADE,
  -- Ensure uniqueness per legislator-issue-period combination
  CONSTRAINT legislator_issue_metrics_unique UNIQUE (legislator_id, issue_id, period_type, period_start)
);

-- Create composite indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_legislator_issue_metrics_legislator 
  ON public.legislator_issue_metrics(legislator_id, period_type);
  
CREATE INDEX IF NOT EXISTS idx_legislator_issue_metrics_issue 
  ON public.legislator_issue_metrics(issue_id, period_type);
  
CREATE INDEX IF NOT EXISTS idx_legislator_issue_metrics_sentiment 
  ON public.legislator_issue_metrics(legislator_id, average_sentiment_score);

-- 2. Add occurred_at timestamp to transcription_segments
-- This enables time-series queries and trend analysis
ALTER TABLE public.transcription_segments 
  ADD COLUMN IF NOT EXISTS occurred_at timestamp with time zone;

-- Backfill occurred_at from meeting scheduled_start + start_time_seconds
UPDATE public.transcription_segments ts
SET occurred_at = m.scheduled_start + (ts.start_time_seconds || ' seconds')::interval
FROM public.meetings m
WHERE ts.meeting_id = m.id AND ts.occurred_at IS NULL;

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_transcription_segments_occurred_at 
  ON public.transcription_segments(occurred_at);

-- 3. Add sentiment_label enum to segment_issues for clearer categorization
DO $$ BEGIN
  CREATE TYPE sentiment_label AS ENUM ('positive', 'negative', 'neutral', 'mixed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.segment_issues 
  ADD COLUMN IF NOT EXISTS sentiment_label sentiment_label;
  
ALTER TABLE public.segment_issues 
  ADD COLUMN IF NOT EXISTS sentiment_confidence numeric; -- 0 to 1 scale

-- Backfill sentiment_label from existing sentiment_score
UPDATE public.segment_issues
SET sentiment_label = CASE
  WHEN sentiment_score > 0.2 THEN 'positive'::sentiment_label
  WHEN sentiment_score < -0.2 THEN 'negative'::sentiment_label
  ELSE 'neutral'::sentiment_label
END
WHERE sentiment_label IS NULL AND sentiment_score IS NOT NULL;

-- 4. Create composite indexes on segment_issues for performance
CREATE INDEX IF NOT EXISTS idx_segment_issues_issue_sentiment 
  ON public.segment_issues(issue_id, sentiment_label) 
  WHERE is_manually_verified = true;

CREATE INDEX IF NOT EXISTS idx_segment_issues_segment_speaker 
  ON public.segment_issues(segment_id, issue_id);

-- Add index to help with legislator-issue joins
CREATE INDEX IF NOT EXISTS idx_transcription_segments_speaker_meeting 
  ON public.transcription_segments(speaker_id, meeting_id);

-- 5. Create materialized view for top issues per legislator
-- This replaces the JSONB top_issues field with a queryable view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.legislator_top_issues AS
SELECT 
  ts.speaker_id as legislator_id,
  si.issue_id,
  COUNT(DISTINCT si.segment_id) as mention_count,
  SUM(ts.end_time_seconds - ts.start_time_seconds) as total_speaking_time_seconds,
  AVG(si.relevance_score) as avg_relevance,
  AVG(si.sentiment_score) as avg_sentiment,
  COUNT(CASE WHEN si.sentiment_label = 'positive' THEN 1 END) as positive_count,
  COUNT(CASE WHEN si.sentiment_label = 'negative' THEN 1 END) as negative_count,
  COUNT(CASE WHEN si.sentiment_label = 'neutral' THEN 1 END) as neutral_count
FROM public.transcription_segments ts
JOIN public.segment_issues si ON ts.id = si.segment_id
WHERE ts.speaker_id IS NOT NULL
GROUP BY ts.speaker_id, si.issue_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_legislator_top_issues_unique 
  ON public.legislator_top_issues(legislator_id, issue_id);

-- 6. Add function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_legislator_top_issues()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.legislator_top_issues;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.legislator_issue_metrics IS 
  'Pre-computed metrics for each legislator-issue combination, enabling fast profile loads';
COMMENT ON COLUMN public.legislator_issue_metrics.sentiment_confidence IS 
  'Average confidence of sentiment predictions (0-1 scale)';
COMMENT ON MATERIALIZED VIEW public.legislator_top_issues IS 
  'Real-time aggregation of top issues per legislator with sentiment breakdown';
