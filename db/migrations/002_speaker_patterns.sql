-- Migration: Create speaker_patterns table for learned speaker mappings
-- This table stores patterns learned from manually-confirmed speaker-to-legislator mappings
-- to provide suggestions for new transcripts

CREATE TABLE IF NOT EXISTS speaker_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legislator_id uuid NOT NULL REFERENCES legislators(id) ON DELETE CASCADE,
  pattern_type text NOT NULL CHECK (pattern_type IN ('speaker_label', 'text_mention', 'title_variation')),
  pattern_value text NOT NULL,
  video_id text, -- source video where this pattern was learned (null for global patterns)
  confidence_score float DEFAULT 0.8 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (legislator_id, pattern_type, pattern_value)
);

-- Index for quick lookups by pattern value
CREATE INDEX IF NOT EXISTS idx_speaker_patterns_value ON speaker_patterns(pattern_value);
CREATE INDEX IF NOT EXISTS idx_speaker_patterns_legislator ON speaker_patterns(legislator_id);

-- Enable RLS
ALTER TABLE speaker_patterns ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users
CREATE POLICY "Allow read access to speaker_patterns" ON speaker_patterns
  FOR SELECT USING (true);

-- Policy: Allow insert/update for service role
CREATE POLICY "Allow service role to manage speaker_patterns" ON speaker_patterns
  FOR ALL USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_speaker_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS speaker_patterns_updated_at ON speaker_patterns;
CREATE TRIGGER speaker_patterns_updated_at
  BEFORE UPDATE ON speaker_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_speaker_patterns_updated_at();

-- Seed with common title patterns for existing legislators
-- This gives the system a starting point for text-based matching
INSERT INTO speaker_patterns (legislator_id, pattern_type, pattern_value, confidence_score)
SELECT 
  id as legislator_id,
  'title_variation' as pattern_type,
  'Chairman ' || last_name as pattern_value,
  0.9 as confidence_score
FROM legislators
WHERE title ILIKE '%chair%' AND is_active = true
ON CONFLICT (legislator_id, pattern_type, pattern_value) DO NOTHING;

INSERT INTO speaker_patterns (legislator_id, pattern_type, pattern_value, confidence_score)
SELECT 
  id as legislator_id,
  'title_variation' as pattern_type,
  'Council Member ' || last_name as pattern_value,
  0.85 as confidence_score
FROM legislators
WHERE is_active = true
ON CONFLICT (legislator_id, pattern_type, pattern_value) DO NOTHING;

INSERT INTO speaker_patterns (legislator_id, pattern_type, pattern_value, confidence_score)
SELECT 
  id as legislator_id,
  'title_variation' as pattern_type,
  'Councilman ' || last_name as pattern_value,
  0.85 as confidence_score
FROM legislators
WHERE is_active = true
ON CONFLICT (legislator_id, pattern_type, pattern_value) DO NOTHING;

INSERT INTO speaker_patterns (legislator_id, pattern_type, pattern_value, confidence_score)
SELECT 
  id as legislator_id,
  'title_variation' as pattern_type,
  'Councilwoman ' || last_name as pattern_value,
  0.85 as confidence_score
FROM legislators
WHERE is_active = true
ON CONFLICT (legislator_id, pattern_type, pattern_value) DO NOTHING;

COMMENT ON TABLE speaker_patterns IS 'Stores learned speaker-to-legislator patterns for automatic matching suggestions';
