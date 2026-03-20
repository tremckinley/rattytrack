-- Meeting Summaries Schema
-- Stores AI-generated summaries for council meetings

-- Create meeting_summaries table
CREATE TABLE IF NOT EXISTS meeting_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    key_points JSONB DEFAULT '[]'::jsonb,      -- Array of key discussion points
    decisions JSONB DEFAULT '[]'::jsonb,        -- Array of decisions made  
    votes_overview JSONB DEFAULT '[]'::jsonb,   -- Summary of voting outcomes
    ai_model_version TEXT DEFAULT 'gpt-4',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one summary per video
    CONSTRAINT unique_video_summary UNIQUE (video_id)
);

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS idx_meeting_summaries_video_id 
    ON meeting_summaries(video_id);

-- Add RLS policies
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on meeting_summaries"
    ON meeting_summaries FOR SELECT
    USING (true);

-- Allow service role to insert/update
CREATE POLICY "Allow service role full access on meeting_summaries"
    ON meeting_summaries FOR ALL
    USING (auth.role() = 'service_role');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_summaries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_meeting_summaries_updated_at
    BEFORE UPDATE ON meeting_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_meeting_summaries_updated_at();

-- Comment on table
COMMENT ON TABLE meeting_summaries IS 'Stores AI-generated summaries of council meetings';
