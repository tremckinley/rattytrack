-- Schema for storing uploaded meeting video transcripts
-- This table stores user-uploaded videos and their transcriptions
-- Separate from the main meetings table which tracks official council meetings

-- Table for uploaded meeting videos
CREATE TABLE IF NOT EXISTS uploaded_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500),
  description TEXT,
  video_filename VARCHAR(500) NOT NULL,
  video_size_bytes BIGINT NOT NULL,
  video_duration_seconds NUMERIC(10, 2),
  video_language VARCHAR(10),
  
  -- Transcription data
  full_transcript TEXT,
  transcription_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  transcription_error TEXT,
  
  -- Metadata
  uploaded_by_user_id UUID, -- References users table if you have auth
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(full_transcript, ''))) STORED,
  
  -- Soft delete
  is_active BOOLEAN DEFAULT TRUE
);

-- Table for storing timestamped segments from uploaded videos
CREATE TABLE IF NOT EXISTS uploaded_meeting_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_meeting_id UUID NOT NULL REFERENCES uploaded_meetings(id) ON DELETE CASCADE,
  
  -- Segment data
  segment_index INTEGER NOT NULL, -- Order in the video
  start_time_seconds NUMERIC(10, 2) NOT NULL,
  end_time_seconds NUMERIC(10, 2) NOT NULL,
  text TEXT NOT NULL,
  
  -- Speaker identification (can be added later)
  speaker_name VARCHAR(255),
  speaker_id UUID, -- References legislators table if matched
  
  -- Search
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
  
  CONSTRAINT unique_segment_per_meeting UNIQUE (uploaded_meeting_id, segment_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploaded_meetings_status ON uploaded_meetings(transcription_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_meetings_uploaded_at ON uploaded_meetings(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_meetings_search ON uploaded_meetings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_uploaded_meetings_active ON uploaded_meetings(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_uploaded_segments_meeting ON uploaded_meeting_segments(uploaded_meeting_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_segments_time ON uploaded_meeting_segments(start_time_seconds);
CREATE INDEX IF NOT EXISTS idx_uploaded_segments_search ON uploaded_meeting_segments USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_uploaded_segments_speaker ON uploaded_meeting_segments(speaker_id) WHERE speaker_id IS NOT NULL;

-- Row Level Security (RLS) Policies
-- Public read access for transparency
ALTER TABLE uploaded_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_meeting_segments ENABLE ROW LEVEL SECURITY;

-- Everyone can read active meetings
CREATE POLICY "Public can view active uploaded meetings"
  ON uploaded_meetings FOR SELECT
  USING (is_active = TRUE);

-- Everyone can read segments
CREATE POLICY "Public can view uploaded meeting segments"
  ON uploaded_meeting_segments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM uploaded_meetings
      WHERE id = uploaded_meeting_segments.uploaded_meeting_id
      AND is_active = TRUE
    )
  );

-- Service role handles all inserts/updates via API routes
-- No direct user uploads to bypass validation
CREATE POLICY "Service role can insert uploaded meetings"
  ON uploaded_meetings FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update uploaded meetings"
  ON uploaded_meetings FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert segments"
  ON uploaded_meeting_segments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions
GRANT SELECT ON uploaded_meetings TO anon, authenticated;
GRANT SELECT ON uploaded_meeting_segments TO anon, authenticated;
GRANT INSERT, UPDATE ON uploaded_meetings TO authenticated, service_role;
GRANT INSERT ON uploaded_meeting_segments TO service_role;

-- Function to search uploaded transcripts
CREATE OR REPLACE FUNCTION search_uploaded_transcripts(search_query TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  meeting_id UUID,
  meeting_title VARCHAR,
  meeting_date TIMESTAMP WITH TIME ZONE,
  segment_id UUID,
  segment_text TEXT,
  segment_start NUMERIC,
  segment_end NUMERIC,
  relevance_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    um.id as meeting_id,
    um.title as meeting_title,
    um.uploaded_at as meeting_date,
    ums.id as segment_id,
    ums.text as segment_text,
    ums.start_time_seconds as segment_start,
    ums.end_time_seconds as segment_end,
    ts_rank(ums.search_vector, websearch_to_tsquery('english', search_query)) as relevance_rank
  FROM uploaded_meeting_segments ums
  JOIN uploaded_meetings um ON um.id = ums.uploaded_meeting_id
  WHERE 
    um.is_active = TRUE
    AND ums.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY relevance_rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
