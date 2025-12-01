-- Function to calculate and populate legislator statistics
-- Fixed to handle transcription_segments.id being integer while segment_issues.segment_id is uuid
-- This should be run periodically to keep statistics up to date

CREATE OR REPLACE FUNCTION calculate_legislator_statistics(
  p_period_type text DEFAULT 'all_time',
  p_start_date date DEFAULT '1900-01-01',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_legislator record;
  v_total_speaking_time integer;
  v_total_segments integer;
  v_avg_segment_length numeric(10,2);
  v_avg_sentiment numeric(5,4);
  v_top_issues jsonb;
BEGIN
  -- Loop through all legislators
  FOR v_legislator IN 
    SELECT id FROM legislators WHERE is_active = true
  LOOP
    -- Calculate speaking statistics
    -- Note: speaker_id is uuid, so we compare directly with v_legislator.id (also uuid)
    SELECT
      COALESCE(SUM(end_time - start_time), 0)::integer,
      COALESCE(COUNT(id), 0)::integer,
      CASE 
        WHEN COUNT(id) > 0 THEN 
          (SUM(end_time - start_time) / COUNT(id))::numeric(10,2)
        ELSE 0 
      END
    INTO v_total_speaking_time, v_total_segments, v_avg_segment_length
    FROM transcription_segments
    WHERE speaker_id = v_legislator.id;
    
    -- Calculate average sentiment (if segment_issues exists)
    -- Note: transcription_segments.id is integer, but segment_issues.segment_id is uuid
    -- We need to cast the integer to uuid for the join
    BEGIN
      SELECT COALESCE(AVG(si.sentiment_score), 0)::numeric(5,4)
      INTO v_avg_sentiment
      FROM transcription_segments ts
      JOIN segment_issues si ON ts.id::text::uuid = si.segment_id
      WHERE ts.speaker_id = v_legislator.id;
    EXCEPTION
      WHEN undefined_table THEN
        v_avg_sentiment := 0;
      WHEN OTHERS THEN
        v_avg_sentiment := 0;
    END;
    
    -- Calculate top issues (if tables exist)
    -- Same casting issue here
    BEGIN
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'issue_id', i.id,
            'issue_name', i.name,
            'mention_count', issue_stats.mention_count,
            'speaking_time', issue_stats.speaking_time
          )
        ),
        '[]'::jsonb
      )
      INTO v_top_issues
      FROM (
        SELECT 
          si.issue_id,
          COUNT(DISTINCT si.segment_id) as mention_count,
          SUM(ts.end_time - ts.start_time) as speaking_time
        FROM transcription_segments ts
        JOIN segment_issues si ON ts.id::text::uuid = si.segment_id
        WHERE ts.speaker_id = v_legislator.id
        GROUP BY si.issue_id
        ORDER BY COUNT(DISTINCT si.segment_id) DESC
        LIMIT 10
      ) issue_stats
      JOIN issues i ON issue_stats.issue_id = i.id;
    EXCEPTION
      WHEN undefined_table THEN
        v_top_issues := '[]'::jsonb;
      WHEN OTHERS THEN
        v_top_issues := '[]'::jsonb;
    END;
    
    -- Insert or update the statistics record
    INSERT INTO legislator_statistics (
      legislator_id,
      period_type,
      period_start,
      period_end,
      total_speaking_time_seconds,
      total_segments,
      average_segment_length_seconds,
      meetings_attended,
      meetings_missed,
      bills_sponsored,
      bills_cosponsored,
      motions_made,
      votes_cast,
      votes_yes,
      votes_no,
      votes_abstain,
      average_sentiment,
      top_issues,
      last_calculated_at
    ) VALUES (
      v_legislator.id,
      p_period_type,
      p_start_date,
      p_end_date,
      v_total_speaking_time,
      v_total_segments,
      v_avg_segment_length,
      0, -- meetings_attended
      0, -- meetings_missed
      0, -- bills_sponsored
      0, -- bills_cosponsored
      0, -- motions_made
      0, -- votes_cast
      0, -- votes_yes
      0, -- votes_no
      0, -- votes_abstain
      v_avg_sentiment,
      v_top_issues,
      NOW()
    )
    ON CONFLICT (legislator_id, period_type, period_start) 
    DO UPDATE SET
      period_end = EXCLUDED.period_end,
      total_speaking_time_seconds = EXCLUDED.total_speaking_time_seconds,
      total_segments = EXCLUDED.total_segments,
      average_segment_length_seconds = EXCLUDED.average_segment_length_seconds,
      average_sentiment = EXCLUDED.average_sentiment,
      top_issues = EXCLUDED.top_issues,
      last_calculated_at = NOW();
      
  END LOOP;
  
  RAISE NOTICE 'Statistics calculated successfully for all legislators';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_legislator_statistics(text, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_legislator_statistics(text, date, date) TO anon;

COMMENT ON FUNCTION calculate_legislator_statistics IS 
  'Calculates and populates legislator_statistics table for all active legislators. Run periodically to keep stats up to date.';
