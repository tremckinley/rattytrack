-- ============================================================================
-- LEGISLATOR INTELLIGENCE PLATFORM - SCHEMA MIGRATION V2
-- Based on ACTUAL schema from new_schema.sql
-- 
-- Key schema facts:
--   - transcription_segments.id = INTEGER (not UUID)
--   - transcription_segments uses video_id (VARCHAR), not meeting_id
--   - Column names: start_time, end_time (not start_time_seconds, end_time_seconds)
--   - segment_issues has sentiment_score
-- ============================================================================

-- ============================================================================
-- 1. AGENDA ITEMS TABLE
-- Links to video_transcriptions via video_id (like transcription_segments does)
-- ============================================================================

CREATE TABLE IF NOT EXISTS agenda_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to video (same pattern as transcription_segments)
    video_id VARCHAR REFERENCES video_transcriptions(video_id) ON DELETE CASCADE,
    
    -- Position in meeting
    item_number INTEGER NOT NULL,
    item_type VARCHAR(50) NOT NULL,  -- 'motion', 'consent', 'public_hearing', 'discussion', 'vote', 'procedural'
    
    -- Content
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- Timing (seconds into video)
    start_time NUMERIC,
    end_time NUMERIC,
    
    -- Related legislation (optional)
    bill_id UUID REFERENCES bills(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'discussed', 'voted', 'tabled', 'deferred'
    vote_result VARCHAR(50),  -- 'passed', 'failed', null
    
    -- Detection metadata
    detection_method VARCHAR(50),  -- 'robert_rules', 'agenda_pdf', 'manual'
    detection_confidence NUMERIC,
    trigger_phrase TEXT,
    
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agenda_items_video ON agenda_items(video_id);
CREATE INDEX IF NOT EXISTS idx_agenda_items_time ON agenda_items(video_id, start_time);
CREATE INDEX IF NOT EXISTS idx_agenda_items_bill ON agenda_items(bill_id);

-- ============================================================================
-- 2. KEY QUOTES TABLE
-- segment_id is INTEGER to match transcription_segments.id
-- ============================================================================

CREATE TABLE IF NOT EXISTS key_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id INTEGER REFERENCES transcription_segments(id) ON DELETE CASCADE,
    legislator_id UUID REFERENCES legislators(id) ON DELETE SET NULL,
    
    -- Quote content
    quote_text TEXT NOT NULL,
    context_before TEXT,
    context_after TEXT,
    
    -- Classification
    impact_level VARCHAR(20) NOT NULL,  -- 'low', 'medium', 'high', 'critical'
    quote_type VARCHAR(50),  -- 'policy_stance', 'controversial', 'emotional', 'decisive'
    
    -- Sentiment & Analysis
    sentiment_score NUMERIC,
    sentiment_intensity NUMERIC,
    
    -- Topic tagging
    primary_issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    
    -- Detection metadata
    ai_model_version VARCHAR(50),
    detection_confidence NUMERIC,
    
    -- Curation flags (no approval required per user decision)
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT true,
    
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_key_quotes_legislator ON key_quotes(legislator_id);
CREATE INDEX IF NOT EXISTS idx_key_quotes_segment ON key_quotes(segment_id);
CREATE INDEX IF NOT EXISTS idx_key_quotes_impact ON key_quotes(impact_level);
CREATE INDEX IF NOT EXISTS idx_key_quotes_issue ON key_quotes(primary_issue_id);

-- ============================================================================
-- 3. LEGISLATOR POSITIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS legislator_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legislator_id UUID REFERENCES legislators(id) ON DELETE CASCADE,
    
    -- What they're positioned on
    bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
    agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL,
    
    -- Position
    position VARCHAR(20) NOT NULL,  -- 'for', 'against', 'neutral', 'undecided'
    position_strength NUMERIC,  -- 0-1 confidence/intensity
    
    -- Source of position determination
    source VARCHAR(50) NOT NULL,  -- 'explicit_vote', 'deliberation_analysis', 'motion_made', 'seconded'
    
    -- Supporting evidence (array of segment IDs - integers)
    supporting_segments INTEGER[],
    
    -- AI analysis metadata (0.3 threshold per user decision)
    ai_confidence NUMERIC,
    ai_model_version VARCHAR(50),
    
    -- Timeline
    first_expressed_at TIMESTAMP WITH TIME ZONE,
    final_position BOOLEAN DEFAULT false,
    
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(legislator_id, bill_id, source)
);

CREATE INDEX IF NOT EXISTS idx_positions_legislator ON legislator_positions(legislator_id);
CREATE INDEX IF NOT EXISTS idx_positions_bill ON legislator_positions(bill_id);
CREATE INDEX IF NOT EXISTS idx_positions_agenda ON legislator_positions(agenda_item_id);

-- ============================================================================
-- 4. MODIFY TRANSCRIPTION_SEGMENTS
-- Add agenda item relationship
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transcription_segments' 
        AND column_name = 'agenda_item_id'
    ) THEN
        ALTER TABLE transcription_segments 
        ADD COLUMN agenda_item_id UUID REFERENCES agenda_items(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_segments_agenda_item ON transcription_segments(agenda_item_id);

-- ============================================================================
-- 5. HELPER FUNCTION FOR UPDATED_AT (if not exists)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. UPDATED_AT TRIGGERS FOR NEW TABLES
-- ============================================================================

DROP TRIGGER IF EXISTS update_agenda_items_updated_at ON agenda_items;
CREATE TRIGGER update_agenda_items_updated_at 
    BEFORE UPDATE ON agenda_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_legislator_positions_updated_at ON legislator_positions;
CREATE TRIGGER update_legislator_positions_updated_at 
    BEFORE UPDATE ON legislator_positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. LEGISLATOR STANCE SUMMARY VIEW
-- Uses segment_issues for sentiment (since transcription_segments doesn't have it)
-- Uses video_id pattern to link segments to agenda items
-- ============================================================================

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

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
