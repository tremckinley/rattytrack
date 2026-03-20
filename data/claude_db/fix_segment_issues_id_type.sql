-- Fix segment_issues table to match transcription_segments id type (integer)
-- Currently segment_id is UUID but transcription_segments.id is INTEGER

-- 1. Drop foreign key if it exists
ALTER TABLE segment_issues DROP CONSTRAINT IF EXISTS segment_issues_segment_id_fkey;

-- 2. Change column type to INTEGER
-- Note: This will fail if there are existing UUID values that can't be cast to integer.
-- Since the table likely has no valid data (due to type mismatch preventing inserts),
-- we can truncate it first if needed, or use USING clause carefully.
-- We'll try to cast, but if it fails, you might need to TRUNCATE segment_issues;
ALTER TABLE segment_issues ALTER COLUMN segment_id TYPE integer USING (
  CASE 
    WHEN segment_id::text ~ '^[0-9]+$' THEN segment_id::text::integer 
    ELSE NULL 
  END
);

-- 3. Add foreign key constraint correctly
ALTER TABLE segment_issues ADD CONSTRAINT segment_issues_segment_id_fkey 
  FOREIGN KEY (segment_id) REFERENCES transcription_segments(id) ON DELETE CASCADE;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_segment_issues_segment_id ON segment_issues(segment_id);
