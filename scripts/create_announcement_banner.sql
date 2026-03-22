-- Create the announcement_banner table
CREATE TABLE IF NOT EXISTS public.announcement_banner (
    id integer PRIMARY KEY DEFAULT 1,
    enabled boolean NOT NULL DEFAULT false,
    message text NOT NULL DEFAULT '',
    type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning')),
    updated_at timestamptz NOT NULL DEFAULT now(),
    -- Constraint: only one row allowed
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert the default row
INSERT INTO public.announcement_banner (id, enabled, message, type)
VALUES (1, false, '', 'info')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.announcement_banner ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see the banner)
CREATE POLICY "Allow public read access on announcement_banner"
    ON public.announcement_banner
    FOR SELECT
    USING (true);

-- Only service_role can write (API routes use requireAdmin + server client)
-- No INSERT/UPDATE/DELETE policies for anon/authenticated = writes blocked at RLS level
