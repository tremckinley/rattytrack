-- Updated schema to support both uploaded files AND YouTube videos
-- Add youtube_video_id field and make video_filename nullable

-- Modify uploaded_meetings table to support YouTube videos
ALTER TABLE uploaded_meetings 
  ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(50) UNIQUE,
  ALTER COLUMN video_filename DROP NOT NULL,
  ALTER COLUMN video_size_bytes DROP NOT NULL;

-- Add index for YouTube video lookups
CREATE INDEX IF NOT EXISTS idx_uploaded_meetings_youtube_id 
  ON uploaded_meetings(youtube_video_id) 
  WHERE youtube_video_id IS NOT NULL;

-- Add constraint to ensure either video_filename OR youtube_video_id is present
ALTER TABLE uploaded_meetings
  ADD CONSTRAINT check_video_source CHECK (
    (video_filename IS NOT NULL AND youtube_video_id IS NULL) OR
    (video_filename IS NULL AND youtube_video_id IS NOT NULL)
  );

-- Update comments
COMMENT ON COLUMN uploaded_meetings.youtube_video_id IS 'YouTube video ID for videos transcribed from YouTube (e.g., dQw4w9WgXcQ)';
COMMENT ON COLUMN uploaded_meetings.video_filename IS 'Filename for user-uploaded videos (null for YouTube videos)';
COMMENT ON COLUMN uploaded_meetings.video_size_bytes IS 'File size in bytes (null for YouTube videos)';
