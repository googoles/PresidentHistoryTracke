-- Master migration file to run all migrations in order
-- Execute this file in Supabase SQL Editor to set up the complete database schema

-- Migration 001: Create profiles table
\i 001_create_profiles_table.sql

-- Migration 002: Create promise ratings table
\i 002_create_promise_ratings_table.sql

-- Migration 003: Create citizen reports table
\i 003_create_citizen_reports_table.sql

-- Migration 004: Create subscriptions table
\i 004_create_subscriptions_table.sql

-- Migration 005: Create comments table
\i 005_create_comments_table.sql

-- Create views for easier data access
CREATE OR REPLACE VIEW promise_stats AS
SELECT 
  promise_id,
  COUNT(*) as total_ratings,
  ROUND(AVG(rating)::DECIMAL, 2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
  MAX(created_at) as latest_rating_date
FROM promise_ratings
GROUP BY promise_id;

-- Create view for promise engagement metrics
CREATE OR REPLACE VIEW promise_engagement AS
SELECT 
  p.promise_id,
  COALESCE(ps.total_ratings, 0) as total_ratings,
  COALESCE(ps.average_rating, 0) as average_rating,
  COUNT(DISTINCT c.id) as total_comments,
  COUNT(DISTINCT cr.id) as total_reports,
  COUNT(DISTINCT s.id) as total_subscriptions,
  MAX(GREATEST(
    COALESCE(ps.latest_rating_date, '1970-01-01'::timestamp),
    COALESCE(MAX(c.created_at), '1970-01-01'::timestamp),
    COALESCE(MAX(cr.created_at), '1970-01-01'::timestamp)
  )) as last_activity_date
FROM (
  SELECT DISTINCT promise_id FROM promise_ratings
  UNION
  SELECT DISTINCT promise_id FROM comments WHERE is_deleted = FALSE
  UNION
  SELECT DISTINCT promise_id FROM citizen_reports
  UNION
  SELECT DISTINCT promise_id FROM subscriptions WHERE is_active = TRUE
) p
LEFT JOIN promise_stats ps ON p.promise_id = ps.promise_id
LEFT JOIN comments c ON p.promise_id = c.promise_id AND c.is_deleted = FALSE
LEFT JOIN citizen_reports cr ON p.promise_id = cr.promise_id
LEFT JOIN subscriptions s ON p.promise_id = s.promise_id AND s.is_active = TRUE
GROUP BY p.promise_id, ps.total_ratings, ps.average_rating, ps.latest_rating_date;

-- Create indexes on views for better performance
CREATE INDEX IF NOT EXISTS idx_promise_stats_promise_id ON promise_ratings(promise_id);
CREATE INDEX IF NOT EXISTS idx_promise_engagement_activity ON comments(promise_id, created_at) WHERE is_deleted = FALSE;

-- Grant permissions for anon and authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON promise_stats, promise_engagement TO anon, authenticated;

-- Grant insert, update, delete permissions to authenticated users (controlled by RLS)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;