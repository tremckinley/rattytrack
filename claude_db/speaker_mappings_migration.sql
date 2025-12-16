-- Speaker Mappings Table
-- Stores persistent speaker label to legislator mappings for reuse across videos

-- Create speaker_mappings table to persist mappings
CREATE TABLE IF NOT EXISTS speaker_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    speaker_label VARCHAR(255) NOT NULL,
    legislator_id UUID NOT NULL REFERENCES legislators(id) ON DELETE CASCADE,
    channel_id VARCHAR(255), -- Optional: specific to a YouTube channel
    confidence VARCHAR(20) DEFAULT 'manual', -- manual, high, medium, low
    created_by VARCHAR(255), -- 'user' or 'auto'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint: one mapping per speaker label (optionally per channel)
    UNIQUE(speaker_label, channel_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_speaker_mappings_label ON speaker_mappings(speaker_label);
CREATE INDEX IF NOT EXISTS idx_speaker_mappings_channel ON speaker_mappings(channel_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_speaker_mappings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER speaker_mappings_updated_at
    BEFORE UPDATE ON speaker_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_speaker_mappings_timestamp();

-- Add comment
COMMENT ON TABLE speaker_mappings IS 'Persistent speaker label to legislator mappings, learned from manual assignments and reused across videos';
