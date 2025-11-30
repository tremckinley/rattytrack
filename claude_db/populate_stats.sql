-- Function to calculate and populate legislator statistics
-- This should be run periodically to keep statistics up to date

CREATE OR REPLACE FUNCTION calculate_legislator_statistics(
  p_period_type text DEFAULT 'all_time',
  p_start_date date DEFAULT '1900-01-01',
  p_end_date date DEFAULT CURRENT_DATE
)
RETURNS void AS $$
DECLARE
  v_legislator record;
  v_stats record;
BEGIN
  -- Loop through all legislators
  FOR v_legislator IN 
    SELECT id FROM legislators WHERE is_active = true
  LOOP
    -- Calculate statistics for this legislator
    SELECT
      -- Speaking statistics
      COALESCE(SUM(ts.end_time_seconds - ts.start_time_seconds), 0)::integer as total_speaking_time_seconds,
      COALESCE(COUNT(ts.id), 0)::integer as total_segments,
      CASE 
        WHEN COUNT(ts.id) > 0 THEN 
          (SUM(ts.end_time_seconds - ts.start_time_seconds) / COUNT(ts.id))::numeric(10,2)
        ELSE 0 
      END as average_segment_length_seconds,
      
      -- Meeting attendance (from meeting_attendees table)
      COALESCE((
        SELECT COUNT(*) 
        FROM meeting_attendees ma 
        WHERE ma.legislator_id = v_legislator.id 
          AND ma.attendance_status = 'present'
      ), 0)::integer as meetings_attended,
      
      COALESCE((
        SELECT COUNT(*) 
        FROM meeting_attendees ma 
        WHERE ma.legislator_id = v_legislator.id 
          AND ma.attendance_status IN ('absent', 'excused')
      ), 0)::integer as meetings_missed,
      
      -- Bill sponsorship
      COALESCE((
        SELECT COUNT(*) 
        FROM bills b 
        WHERE b.primary_sponsor_id = v_legislator.id
      ), 0)::integer as bills_sponsored,
      
      COALESCE((
        SELECT COUNT(*) 
        FROM bill_cosponsors bc 
        WHERE bc.legislator_id = v_legislator.id
      ), 0)::integer as bills_cosponsored,
      
      -- Voting records
      COALESCE((
        SELECT COUNT(*) 
        FROM vote_records vr 
        WHERE vr.legislator_id = v_legislator.id
      ), 0)::integer as votes_cast,
      
      COALESCE((
        SELECT COUNT(*) 
        FROM vote_records vr 
        WHERE vr.legislator_id = v_legislator.id 
          AND vr.vote = 'yes'
      ), 0)::integer as votes_yes,
      
      COALESCE((
        SELECT COUNT(*) 
        FROM vote_records vr 
        WHERE vr.legislator_id = v_legislator.id 
          AND vr.vote = 'no'
      ), 0)::integer as votes_no,
      
      COALESCE((
        SELECT COUNT(*) 
        FROM vote_records vr 
        WHERE vr.legislator_id = v_legislator.id 
          AND vr.vote = 'abstain'
      ), 0)::integer as votes_abstain,
      
      -- Motions made
      COALESCE((
        SELECT COUNT(*) 
        FROM legislative_actions la 
        WHERE la.moved_by_id = v_legislator.id
      ), 0)::integer as motions_made,
      
      -- Average sentiment
      COALESCE((
        SELECT AVG(si.sentiment_score)
        FROM transcription_segments ts
        JOIN segment_issues si ON ts.id = si.segment_id
        WHERE ts.speaker_id = v_legislator.id
      ), 0)::numeric(5,4) as average_sentiment,
      
      -- Top issues (as JSONB array)
      COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'issue_id', i.id,
            'issue_name', i.name,
            'mention_count', issue_stats.mention_count,
            'speaking_time', issue_stats.speaking_time
          )
        )
        FROM (
          SELECT 
            si.issue_id,
            COUNT(DISTINCT si.segment_id) as mention_count,
            SUM(ts.end_time_seconds - ts.start_time_seconds) as speaking_time
          FROM transcription_segments ts
          JOIN segment_issues si ON ts.id = si.segment_id
          WHERE ts.speaker_id = v_legislator.id
          GROUP BY si.issue_id
          ORDER BY COUNT(DISTINCT si.segment_id) DESC
          LIMIT 10
        ) issue_stats
        JOIN issues i ON issue_stats.issue_id = i.id
      ), '[]'::jsonb) as top_issues
      
    INTO v_stats
    FROM transcription_segments ts
    WHERE ts.speaker_id = v_legislator.id;
    
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
      v_stats.total_speaking_time_seconds,
      v_stats.total_segments,
      v_stats.average_segment_length_seconds,
      v_stats.meetings_attended,
      v_stats.meetings_missed,
      v_stats.bills_sponsored,
      v_stats.bills_cosponsored,
      v_stats.motions_made,
      v_stats.votes_cast,
      v_stats.votes_yes,
      v_stats.votes_no,
      v_stats.votes_abstain,
      v_stats.average_sentiment,
      v_stats.top_issues,
      NOW()
    )
    ON CONFLICT (legislator_id, period_type, period_start) 
    DO UPDATE SET
      period_end = EXCLUDED.period_end,
      total_speaking_time_seconds = EXCLUDED.total_speaking_time_seconds,
      total_segments = EXCLUDED.total_segments,
      average_segment_length_seconds = EXCLUDED.average_segment_length_seconds,
      meetings_attended = EXCLUDED.meetings_attended,
      meetings_missed = EXCLUDED.meetings_missed,
      bills_sponsored = EXCLUDED.bills_sponsored,
      bills_cosponsored = EXCLUDED.bills_cosponsored,
      motions_made = EXCLUDED.motions_made,
      votes_cast = EXCLUDED.votes_cast,
      votes_yes = EXCLUDED.votes_yes,
      votes_no = EXCLUDED.votes_no,
      votes_abstain = EXCLUDED.votes_abstain,
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
