-- Get the Memphis City Council ID
DO $$ 
DECLARE
    council_id UUID;
BEGIN
    SELECT id INTO council_id FROM legislative_bodies WHERE name = 'Memphis City Council';

    -- Create sample issues
    INSERT INTO issues (name, description, slug, jurisdiction_id, is_active, created_by)
    VALUES
    ('Public Safety', 'Issues related to police, fire, and emergency services', 'public-safety', 
        (SELECT id FROM jurisdictions WHERE name = 'Memphis'), true, NULL),
    ('Infrastructure', 'Roads, bridges, and public works projects', 'infrastructure',
        (SELECT id FROM jurisdictions WHERE name = 'Memphis'), true, NULL),
    ('Budget', 'City budget, spending, and financial matters', 'budget',
        (SELECT id FROM jurisdictions WHERE name = 'Memphis'), true, NULL),
    ('Housing', 'Housing development and affordability initiatives', 'housing',
        (SELECT id FROM jurisdictions WHERE name = 'Memphis'), true, NULL),
    ('Transportation', 'Public transit and transportation planning', 'transportation',
        (SELECT id FROM jurisdictions WHERE name = 'Memphis'), true, NULL);

    -- Create a sample meeting
    INSERT INTO meetings (
        legislative_body_id, 
        meeting_type,
        title,
        description,
        scheduled_start,
        actual_start,
        actual_end,
        status,
        processing_status,
        transcription_status
    )
    VALUES
    (
        council_id,
        'regular',
        'City Council Regular Session',
        'Regular session of the Memphis City Council discussing budget amendments and public safety initiatives',
        '2025-10-15 14:00:00-05:00',
        '2025-10-15 14:05:00-05:00',
        '2025-10-15 16:30:00-05:00',
        'completed',
        'completed',
        'completed'
    );

    -- Add meeting attendees
    INSERT INTO meeting_attendees (
        meeting_id,
        legislator_id,
        attendance_status,
        join_time,
        leave_time
    )
    SELECT 
        (SELECT id FROM meetings WHERE title = 'City Council Regular Session'),
        id,
        'present',
        '2025-10-15 14:05:00-05:00',
        '2025-10-15 16:30:00-05:00'
    FROM legislators 
    WHERE legislative_body_id = council_id
    LIMIT 10;

    -- Add transcription segments
    WITH meeting_data AS (
        SELECT 
            m.id as meeting_id,
            array_agg(l.id) as legislator_ids
        FROM meetings m
        CROSS JOIN legislators l
        WHERE m.title = 'City Council Regular Session'
        AND l.legislative_body_id = council_id
        GROUP BY m.id
    )
    INSERT INTO transcription_segments (
        meeting_id,
        speaker_id,
        start_time_seconds,
        end_time_seconds,
        text,
        confidence_score
    )
    SELECT
        meeting_id,
        legislator_ids[1 + (random() * (array_length(legislator_ids, 1) - 1))::integer],
        start_time,
        start_time + duration,
        speech_text,
        random() * 0.3 + 0.7  -- Random confidence between 0.7 and 1.0
    FROM meeting_data,
    (VALUES
        (0, 45, 'I call this meeting of the Memphis City Council to order. Today we''ll be discussing the proposed budget amendments and public safety initiatives.'),
        (60, 120, 'Thank you, Madam Chair. I''d like to address the proposed increase in funding for our police department''s community outreach programs.'),
        (190, 180, 'The data shows that community policing initiatives have reduced crime rates in pilot neighborhoods by 15% over the past six months.'),
        (380, 150, 'I support the infrastructure improvements in District 3, but we need to ensure equitable distribution of resources across all districts.'),
        (540, 90, 'The housing development project on Madison Avenue needs additional oversight. I propose we form a special committee.'),
        (640, 160, 'Public transportation remains a critical issue. The proposed bus route expansions will help connect underserved neighborhoods to job centers.'),
        (810, 140, 'I move to amend the budget to allocate an additional $2 million for road repairs in flood-prone areas.'),
        (960, 200, 'The public safety committee has reviewed the proposal and recommends approval with the suggested modifications.')
    ) AS t(start_time, duration, speech_text);

    -- Link segments to relevant issues
    INSERT INTO segment_issues (
        segment_id,
        issue_id,
        relevance_score,
        created_by
    )
    SELECT 
        ts.id,
        i.id,
        random() * 0.4 + 0.6,  -- Random relevance score between 0.6 and 1.0
        NULL
    FROM transcription_segments ts
    CROSS JOIN issues i
    WHERE 
        (ts.text ILIKE '%police%' AND i.slug = 'public-safety') OR
        (ts.text ILIKE '%infrastructure%' AND i.slug = 'infrastructure') OR
        (ts.text ILIKE '%budget%' AND i.slug = 'budget') OR
        (ts.text ILIKE '%housing%' AND i.slug = 'housing') OR
        (ts.text ILIKE '%transportation%' AND i.slug = 'transportation');

END $$;
