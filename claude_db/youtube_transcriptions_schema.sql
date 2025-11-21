-- Schema for storing YouTube video transcriptions
-- This table stores transcriptions of YouTube videos from city council channels

-- Table for YouTube video transcriptions
CREATE TABLE IF NOT EXISTS youtube_transcriptions (
  video_id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  channel_title VARCHAR(255) NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration NUMERIC(10, 2) NOT NULL,
  thumbnail_url TEXT,
  
  -- Transcription data
  status VARCHAR(50) DEFAULT 'idle',
  error_message TEXT,
  transcription_cost NUMERIC(10, 4),
  provider VARCHAR(20) DEFAULT 'whisper',
  diarization_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing timestamped segments from YouTube videos
CREATE TABLE IF NOT EXISTS youtube_transcript_segments (
  id SERIAL PRIMARY KEY,
  video_id VARCHAR(50) NOT NULL REFERENCES youtube_transcriptions(video_id) ON DELETE CASCADE,
  
  -- Segment data
  start_time NUMERIC(10, 2) NOT NULL,
  end_time NUMERIC(10, 2) NOT NULL,
  text TEXT NOT NULL,
  
  -- Speaker identification (for diarization)
  speaker_name VARCHAR(255),
  speaker_id UUID,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_youtube_transcriptions_status ON youtube_transcriptions(status);
CREATE INDEX IF NOT EXISTS idx_youtube_transcriptions_created_at ON youtube_transcriptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_transcriptions_provider ON youtube_transcriptions(provider);

CREATE INDEX IF NOT EXISTS idx_youtube_segments_video ON youtube_transcript_segments(video_id);
CREATE INDEX IF NOT EXISTS idx_youtube_segments_time ON youtube_transcript_segments(start_time);
CREATE INDEX IF NOT EXISTS idx_youtube_segments_speaker ON youtube_transcript_segments(speaker_id) WHERE speaker_id IS NOT NULL;
