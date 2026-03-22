-- Database functions for legislator issue metrics

-- Function to get legislator issue breakdown with sentiment analysis
-- This aggregates directly from segment_issues and transcription_segments
CREATE OR REPLACE FUNCTION get_legislator_issue_breakdown(
  p_legislator_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  issue_id uuid,
  issue_name varchar,
  total_mentions bigint,
  positive_mentions bigint,
  negative_mentions bigint,
  neutral_mentions bigint,
  average_sentiment_score numeric,
  total_speaking_time_seconds numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as issue_id,
    i.name as issue_name,
    COUNT(DISTINCT si.segment_id)::bigint as total_mentions,
    COUNT(CASE WHEN si.sentiment_label = 'positive' THEN 1 END)::bigint as positive_mentions,
    COUNT(CASE WHEN si.sentiment_label = 'negative' THEN 1 END)::bigint as negative_mentions,
    COUNT(CASE WHEN si.sentiment_label = 'neutral' THEN 1 END)::bigint as neutral_mentions,
    AVG(si.sentiment_score) as average_sentiment_score,
    SUM(ts.end_time - ts.start_time) as total_speaking_time_seconds
  FROM public.issues i
  JOIN public.segment_issues si ON i.id = si.issue_id
  JOIN public.transcription_segments ts ON si.segment_id = ts.id
  WHERE ts.speaker_id = p_legislator_id
  GROUP BY i.id, i.name
  ORDER BY COUNT(DISTINCT si.segment_id) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_legislator_issue_breakdown(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_legislator_issue_breakdown(uuid, integer) TO anon;

COMMENT ON FUNCTION get_legislator_issue_breakdown IS 
  'Aggregates issue mentions and sentiment for a legislator from segment data';
