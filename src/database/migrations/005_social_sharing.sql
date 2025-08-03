-- Social Sharing and Analytics Enhancement Migration
-- This file should be executed in your Supabase SQL editor

-- Create social_shares table for tracking sharing events
CREATE TABLE IF NOT EXISTS social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  share_method TEXT NOT NULL CHECK (share_method IN ('native', 'clipboard', 'twitter', 'facebook', 'linkedin', 'telegram', 'whatsapp', 'kakao', 'attempted', 'failed', 'fallback')),
  user_agent TEXT,
  referrer TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_cache table for caching expensive calculations
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promise_engagement_summary view for faster analytics queries
CREATE OR REPLACE VIEW promise_engagement_summary AS
SELECT 
  p.promise_id,
  COUNT(DISTINCT CASE WHEN p.action_type = 'comment' THEN p.user_id END) as unique_commenters,
  COUNT(CASE WHEN p.action_type = 'comment' THEN 1 END) as total_comments,
  COUNT(CASE WHEN p.action_type = 'rating' THEN 1 END) as total_ratings,
  COUNT(CASE WHEN p.action_type = 'report' THEN 1 END) as total_reports,
  AVG(CASE WHEN p.action_type = 'rating' THEN (p.additional_data->>'rating')::FLOAT END) as average_rating,
  COUNT(DISTINCT p.user_id) as unique_users,
  COUNT(*) as total_engagements,
  MAX(p.created_at) as last_activity
FROM (
  SELECT promise_id, user_id, 'comment' as action_type, created_at, '{}' as additional_data
  FROM comments
  UNION ALL
  SELECT promise_id, user_id, 'rating' as action_type, created_at, jsonb_build_object('rating', rating) as additional_data
  FROM promise_ratings
  UNION ALL
  SELECT promise_id, user_id, 'report' as action_type, created_at, jsonb_build_object('type', report_type) as additional_data
  FROM citizen_reports
) p
GROUP BY p.promise_id;

-- Create trending_scores view for real-time trending calculation
CREATE OR REPLACE VIEW trending_scores AS
WITH recent_activity AS (
  SELECT 
    promise_id,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as activity_1h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '6 hours') as activity_6h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as activity_24h,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as activity_7d
  FROM (
    SELECT promise_id, created_at FROM comments
    UNION ALL
    SELECT promise_id, created_at FROM promise_ratings
    UNION ALL
    SELECT promise_id, created_at FROM citizen_reports
  ) activities
  GROUP BY promise_id
),
share_velocity AS (
  SELECT 
    promise_id,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '1 hour') as shares_1h,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') as shares_24h
  FROM social_shares 
  WHERE share_method NOT IN ('attempted', 'failed')
  GROUP BY promise_id
)
SELECT 
  ra.promise_id,
  -- Calculate trending score based on recent activity and velocity
  COALESCE(
    (ra.activity_1h * 100) + 
    (ra.activity_6h * 20) + 
    (ra.activity_24h * 5) + 
    (COALESCE(sv.shares_1h, 0) * 50) +
    (COALESCE(sv.shares_24h, 0) * 10)
  , 0) as trending_score,
  ra.activity_1h,
  ra.activity_6h,
  ra.activity_24h,
  ra.activity_7d,
  COALESCE(sv.shares_1h, 0) as shares_1h,
  COALESCE(sv.shares_24h, 0) as shares_24h,
  -- Calculate velocity (engagements per hour)
  CASE 
    WHEN ra.activity_24h > 0 THEN ra.activity_24h::FLOAT / 24
    ELSE 0 
  END as velocity_24h
FROM recent_activity ra
LEFT JOIN share_velocity sv ON ra.promise_id = sv.promise_id;

-- Create regional_engagement_summary view
CREATE OR REPLACE VIEW regional_engagement_summary AS
WITH promise_regions AS (
  -- This would need to be populated based on your promise data structure
  -- For now, we'll create a mapping that you can populate
  SELECT 'example-promise-id' as promise_id, 'seoul' as region_key
  -- Add more mappings as needed
)
SELECT 
  pr.region_key,
  COUNT(DISTINCT pes.promise_id) as total_promises,
  SUM(pes.total_comments) as total_comments,
  SUM(pes.total_ratings) as total_ratings,
  SUM(pes.total_reports) as total_reports,
  SUM(pes.total_engagements) as total_engagements,
  AVG(pes.average_rating) as average_rating,
  COUNT(DISTINCT pes.unique_users) as unique_users
FROM promise_regions pr
LEFT JOIN promise_engagement_summary pes ON pr.promise_id = pes.promise_id
GROUP BY pr.region_key;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_shares_promise_id ON social_shares(promise_id);
CREATE INDEX IF NOT EXISTS idx_social_shares_timestamp ON social_shares(timestamp);
CREATE INDEX IF NOT EXISTS idx_social_shares_method ON social_shares(share_method);
CREATE INDEX IF NOT EXISTS idx_social_shares_user_id ON social_shares(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Create indexes on existing tables for analytics performance
CREATE INDEX IF NOT EXISTS idx_comments_promise_created ON comments(promise_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_promise_created ON promise_ratings(promise_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_promise_created ON citizen_reports(promise_id, created_at);

-- Row Level Security policies for social_shares
ALTER TABLE social_shares ENABLE ROW LEVEL SECURITY;

-- Users can read all social sharing stats (anonymized)
CREATE POLICY "Users can read social sharing stats" ON social_shares
  FOR SELECT USING (true);

-- Users can insert their own sharing events
CREATE POLICY "Users can create sharing events" ON social_shares
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Row Level Security for analytics_cache
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- All users can read cached analytics data
CREATE POLICY "Users can read analytics cache" ON analytics_cache
  FOR SELECT USING (true);

-- Only authenticated users can insert/update cache (for admin functions)
CREATE POLICY "Authenticated users can manage cache" ON analytics_cache
  FOR ALL USING (auth.role() = 'authenticated');

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get or set cache
CREATE OR REPLACE FUNCTION get_or_set_cache(
  key TEXT,
  data JSONB DEFAULT NULL,
  ttl_minutes INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  cached_data JSONB;
BEGIN
  -- Try to get existing cache
  SELECT cache_data INTO cached_data
  FROM analytics_cache
  WHERE cache_key = key AND expires_at > NOW();
  
  -- If cache exists, return it
  IF cached_data IS NOT NULL THEN
    RETURN cached_data;
  END IF;
  
  -- If data provided, cache it
  IF data IS NOT NULL THEN
    INSERT INTO analytics_cache (cache_key, cache_data, expires_at)
    VALUES (key, data, NOW() + (ttl_minutes || ' minutes')::INTERVAL)
    ON CONFLICT (cache_key) 
    DO UPDATE SET 
      cache_data = EXCLUDED.cache_data,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW();
    
    RETURN data;
  END IF;
  
  -- No cache and no data provided
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track viral content
CREATE OR REPLACE FUNCTION analyze_viral_potential(
  target_promise_id TEXT,
  time_window_hours INTEGER DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  viral_threshold INTEGER := 50;
  trending_threshold INTEGER := 20;
BEGIN
  WITH recent_metrics AS (
    SELECT 
      COUNT(*) FILTER (WHERE action_type = 'comment') as recent_comments,
      COUNT(*) FILTER (WHERE action_type = 'rating') as recent_ratings,
      COUNT(*) FILTER (WHERE action_type = 'report') as recent_reports,
      COUNT(DISTINCT user_id) as unique_users
    FROM (
      SELECT promise_id, user_id, 'comment' as action_type, created_at
      FROM comments
      WHERE promise_id = target_promise_id 
        AND created_at >= NOW() - (time_window_hours || ' hours')::INTERVAL
      UNION ALL
      SELECT promise_id, user_id, 'rating' as action_type, created_at
      FROM promise_ratings
      WHERE promise_id = target_promise_id 
        AND created_at >= NOW() - (time_window_hours || ' hours')::INTERVAL
      UNION ALL
      SELECT promise_id, user_id, 'report' as action_type, created_at
      FROM citizen_reports
      WHERE promise_id = target_promise_id 
        AND created_at >= NOW() - (time_window_hours || ' hours')::INTERVAL
    ) activities
  ),
  share_metrics AS (
    SELECT 
      COUNT(*) as recent_shares
    FROM social_shares
    WHERE promise_id = target_promise_id
      AND timestamp >= NOW() - (time_window_hours || ' hours')::INTERVAL
      AND share_method NOT IN ('attempted', 'failed')
  )
  SELECT jsonb_build_object(
    'isViral', CASE WHEN (
      (rm.recent_comments + rm.recent_ratings + rm.recent_reports) * 5 +
      sm.recent_shares * 25 +
      rm.unique_users * 10
    ) > viral_threshold THEN true ELSE false END,
    'isTrending', CASE WHEN (
      (rm.recent_comments + rm.recent_ratings + rm.recent_reports) * 5 +
      sm.recent_shares * 25 +
      rm.unique_users * 10
    ) > trending_threshold THEN true ELSE false END,
    'viralScore', (
      (rm.recent_comments + rm.recent_ratings + rm.recent_reports) * 5 +
      sm.recent_shares * 25 +
      rm.unique_users * 10
    ),
    'metrics', jsonb_build_object(
      'recentComments', rm.recent_comments,
      'recentRatings', rm.recent_ratings,
      'recentReports', rm.recent_reports,
      'recentShares', sm.recent_shares,
      'uniqueUsers', rm.unique_users,
      'velocity', ROUND((rm.recent_comments + rm.recent_ratings + rm.recent_reports)::NUMERIC / time_window_hours, 2),
      'shareRate', CASE 
        WHEN (rm.recent_comments + rm.recent_ratings + rm.recent_reports) > 0 
        THEN ROUND(sm.recent_shares::NUMERIC / (rm.recent_comments + rm.recent_ratings + rm.recent_reports), 2)
        ELSE 0
      END
    )
  ) INTO result
  FROM recent_metrics rm
  CROSS JOIN share_metrics sm;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON promise_engagement_summary TO anon, authenticated;
GRANT SELECT ON trending_scores TO anon, authenticated;
GRANT SELECT ON regional_engagement_summary TO anon, authenticated;
GRANT EXECUTE ON FUNCTION analyze_viral_potential TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_or_set_cache TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_cache TO authenticated;

-- Create a scheduled job to clean up expired cache (requires pg_cron extension)
-- This would be set up separately in Supabase dashboard if needed
-- SELECT cron.schedule('cleanup-analytics-cache', '0 */6 * * *', 'SELECT cleanup_expired_cache();');

COMMENT ON TABLE social_shares IS 'Tracks social media sharing events for viral analysis';
COMMENT ON TABLE analytics_cache IS 'Caches expensive analytics calculations to improve performance';
COMMENT ON VIEW promise_engagement_summary IS 'Aggregated engagement metrics per promise';
COMMENT ON VIEW trending_scores IS 'Real-time trending scores based on recent activity';
COMMENT ON VIEW regional_engagement_summary IS 'Regional engagement statistics';
COMMENT ON FUNCTION analyze_viral_potential IS 'Analyzes viral potential of specific promises';
COMMENT ON FUNCTION get_or_set_cache IS 'Manages analytics data caching';
COMMENT ON FUNCTION cleanup_expired_cache IS 'Removes expired cache entries';