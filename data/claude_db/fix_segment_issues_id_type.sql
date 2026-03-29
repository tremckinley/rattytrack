-- =============================================================================
-- Fix segment_issues.segment_id type mismatch (WITH VIEW RECONSTRUCTION)
-- 
-- PROBLEM: segment_issues.segment_id is 'uuid' but transcription_segments.id
--          is an INTEGER. Postgres raises FK violation on insert.
--          Directly altering fails if views depend on the column.
--
-- FIX: 
--   1. Drop dependent views/materialized views
--   2. Convert segment_id column to bigint
--   3. Rebuild FK and index
--   4. Recreate views/materialized views
-- =============================================================================

-- Step 0: Drop dependent views (Postgres requires this to alter column types)
DROP VIEW IF EXISTS legislator_stance_summary;
DROP MATERIALIZED VIEW IF EXISTS legislator_top_issues;

-- Step 1: Remove AI-generated rows that may have invalid data
DELETE FROM segment_issues WHERE manually_added = false;

-- Step 2: Drop the existing FK constraint
ALTER TABLE segment_issues DROP CONSTRAINT IF EXISTS segment_issues_segment_id_fkey;

-- Step 3: Convert the column type from uuid to bigint (matching transcription_segments.id)
ALTER TABLE segment_issues 
  ALTER COLUMN segment_id TYPE bigint USING (
    CASE 
      WHEN segment_id::text ~ '^\d+$' THEN segment_id::text::bigint
      ELSE NULL
    END
  );

-- Step 4: Re-add FK constraint with CASCADE DELETE
ALTER TABLE segment_issues 
  ADD CONSTRAINT segment_issues_segment_id_fkey 
  FOREIGN KEY (segment_id) REFERENCES transcription_segments(id) ON DELETE CASCADE;

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_segment_issues_segment_id ON segment_issues(segment_id);

-- Step 6: Recreate legislator_stance_summary view
CREATE OR REPLACE VIEW legislator_stance_summary AS
SELECT 
    l.id as legislator_id,
    l.display_name,
    b.id as bill_id,
    b.bill_number,
    b.title as bill_title,
    
    -- Final position (prefer vote, fallback to deliberation)
    COALESCE(
        (SELECT lp.position FROM legislator_positions lp 
         WHERE lp.legislator_id = l.id AND lp.bill_id = b.id AND lp.source = 'explicit_vote'
         LIMIT 1),
        (SELECT lp.position FROM legislator_positions lp 
         WHERE lp.legislator_id = l.id AND lp.bill_id = b.id AND lp.source = 'deliberation_analysis'
         ORDER BY lp.ai_confidence DESC LIMIT 1)
    ) as final_position,
    
    -- Explicit vote if exists from vote_records
    vr.vote as explicit_vote,
    
    -- Average deliberation sentiment from segment_issues
    (SELECT AVG(si.sentiment_score) 
     FROM segment_issues si
     JOIN transcription_segments ts ON si.segment_id = ts.id
     WHERE ts.speaker_id = l.id 
     AND ts.agenda_item_id IN (SELECT ai.id FROM agenda_items ai WHERE ai.bill_id = b.id)
    ) as avg_deliberation_sentiment,
    
    -- Count of key quotes
    (SELECT COUNT(*) FROM key_quotes kq 
     WHERE kq.legislator_id = l.id 
     AND kq.segment_id IN (
         SELECT ts.id FROM transcription_segments ts 
         JOIN agenda_items ai ON ts.agenda_item_id = ai.id 
         WHERE ai.bill_id = b.id
     )
    ) as relevant_quote_count

FROM legislators l
CROSS JOIN bills b
LEFT JOIN legislative_actions la ON la.bill_id = b.id AND la.action_type = 'vote'
LEFT JOIN vote_records vr ON vr.legislative_action_id = la.id AND vr.legislator_id = l.id;

-- Step 7: Recreate legislator_top_issues materialized view
CREATE MATERIALIZED VIEW legislator_top_issues AS
SELECT 
  ts.speaker_id as legislator_id,
  si.issue_id,
  COUNT(DISTINCT si.segment_id) as mention_count,
  SUM(ts.end_time - ts.start_time) as total_speaking_time_seconds,
  AVG(si.relevance_score) as avg_relevance,
  AVG(si.sentiment_score) as avg_sentiment,
  COUNT(CASE WHEN si.sentiment_label = 'positive' THEN 1 END) as positive_count,
  COUNT(CASE WHEN si.sentiment_label = 'negative' THEN 1 END) as negative_count,
  COUNT(CASE WHEN si.sentiment_label = 'neutral' THEN 1 END) as neutral_count
FROM public.transcription_segments ts
JOIN public.segment_issues si ON ts.id = si.segment_id
WHERE ts.speaker_id IS NOT NULL
GROUP BY ts.speaker_id, si.issue_id;

-- Step 8: Recreate unique index for materialized view (required for concurrent refresh)
CREATE UNIQUE INDEX idx_legislator_top_issues_unique 
  ON public.legislator_top_issues(legislator_id, issue_id);

-- Verify the fix
SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'segment_issues' AND column_name = 'segment_id';
