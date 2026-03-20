-- Drop old YouTube-specific tables (test data only)
DROP TABLE IF EXISTS youtube_transcript_segments CASCADE;
DROP TABLE IF EXISTS youtube_transcriptions CASCADE;

-- Create unified video transcriptions table
CREATE TABLE IF NOT EXISTS video_transcriptions (
  video_id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  channel_title VARCHAR(255) NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  duration NUMERIC(10,2) NOT NULL,
  thumbnail_url TEXT,
  source VARCHAR(20) NOT NULL DEFAULT 'youtube', -- 'youtube', 'upload', 'livestream'
  status VARCHAR(50) DEFAULT 'idle', -- 'idle', 'processing', 'downloading', 'transcribing', 'completed', 'error'
  error_message TEXT,
  transcription_cost NUMERIC(10,4),
  provider VARCHAR(20) DEFAULT 'whisper', -- 'whisper', 'elevenlabs'
  diarization_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unified transcription segments table
CREATE TABLE IF NOT EXISTS transcription_segments (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(50) NOT NULL REFERENCES video_transcriptions(video_id) ON DELETE CASCADE,
  start_time NUMERIC(10,2) NOT NULL,
  end_time NUMERIC(10,2) NOT NULL,
  text TEXT NOT NULL,
  speaker_name VARCHAR(255), -- Raw speaker label from diarization (e.g., 'speaker_0')
  speaker_id UUID, -- FK to legislators.id after manual mapping
  source VARCHAR(20) NOT NULL DEFAULT 'youtube', -- 'youtube', 'upload', 'livestream'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transcriptions_created_at ON video_transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transcriptions_provider ON video_transcriptions(provider);
CREATE INDEX IF NOT EXISTS idx_transcriptions_status ON video_transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_transcriptions_source ON video_transcriptions(source);

CREATE INDEX IF NOT EXISTS idx_segments_video ON transcription_segments(video_id);
CREATE INDEX IF NOT EXISTS idx_segments_time ON transcription_segments(start_time);
CREATE INDEX IF NOT EXISTS idx_segments_speaker ON transcription_segments(speaker_id) WHERE speaker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_segments_source ON transcription_segments(source);

-- Enable RLS (Row Level Security) for public read access
ALTER TABLE video_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcription_segments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Public can view video transcriptions" ON video_transcriptions;
CREATE POLICY "Public can view video transcriptions"
  ON video_transcriptions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can view transcription segments" ON transcription_segments;
CREATE POLICY "Public can view transcription segments"
  ON transcription_segments FOR SELECT
  USING (true);

-- Grant service role full access for backend operations
GRANT ALL ON video_transcriptions TO service_role;
GRANT ALL ON transcription_segments TO service_role;
GRANT USAGE, SELECT ON SEQUENCE transcription_segments_id_seq TO service_role;
