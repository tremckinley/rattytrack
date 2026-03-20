-- Meeting Documents Schema
-- Stores scraped documents from Memphis City Council website with extracted text for AI context

-- Create the meeting_documents table
CREATE TABLE IF NOT EXISTS public.meeting_documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    meeting_id uuid,  -- FK to meetings (optional, for associated meetings)
    meeting_date date NOT NULL,  -- For documents before meeting record exists
    document_type varchar NOT NULL,  -- 'regular_agenda', 'committee_agenda', 'regular_docs', etc.
    title varchar NOT NULL,
    source_url varchar NOT NULL,  -- Original URL from city website
    file_path varchar,  -- Supabase Storage path (optional - may just store text)
    file_size_bytes bigint,
    extracted_text text,  -- Full text for AI context
    text_extraction_status varchar DEFAULT 'pending',  -- pending, completed, failed
    text_extraction_error text,
    page_count integer,
    scraped_at timestamp with time zone DEFAULT now(),
    last_checked_at timestamp with time zone,
    metadata jsonb,  -- Store any additional parsed info
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT meeting_documents_pkey PRIMARY KEY (id),
    CONSTRAINT meeting_documents_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE SET NULL
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_meeting_documents_date ON public.meeting_documents(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_documents_type ON public.meeting_documents(document_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_documents_url ON public.meeting_documents(source_url);

-- Enable Row Level Security (optional, for future multi-tenant support)
ALTER TABLE public.meeting_documents ENABLE ROW LEVEL SECURITY;

-- Allow public read access (adjust based on your needs)
CREATE POLICY "Allow public read access" ON public.meeting_documents
    FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON public.meeting_documents
    FOR ALL USING (auth.role() = 'service_role');

-- Document type enum values for reference:
-- 'regular_agenda'      - Regular Meeting Agenda
-- 'regular_docs'        - Regular Meeting Documents  
-- 'committee_agenda'    - Committee Meeting Agenda
-- 'committee_docs'      - Committee Meeting Documents
-- 'pz_regular_docs'     - Planning & Zoning Regular Documents
-- 'pz_committee_docs'   - Planning & Zoning Committee Documents
-- 'minutes'             - Official Meeting Minutes
-- 'additional'          - Additional Documents, Resolutions, etc.

COMMENT ON TABLE public.meeting_documents IS 'Scraped documents from Memphis City Council website with extracted text for AI context';
COMMENT ON COLUMN public.meeting_documents.document_type IS 'Type: regular_agenda, regular_docs, committee_agenda, committee_docs, pz_regular_docs, pz_committee_docs, minutes, additional';
COMMENT ON COLUMN public.meeting_documents.extracted_text IS 'Full text extracted from PDF for AI context during transcription';
COMMENT ON COLUMN public.meeting_documents.text_extraction_status IS 'Status: pending, completed, failed';
