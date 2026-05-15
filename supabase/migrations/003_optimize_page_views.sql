-- Migration: Add data retention and optimize page_views
-- Date: 2026-01-18
-- Purpose: Prevent unbounded table growth and improve query performance

-- ============================================
-- Add retention policy via triggers/functions
-- ============================================

-- Create function to clean old page views
CREATE OR REPLACE FUNCTION delete_old_page_views()
RETURNS void AS $$
BEGIN
  -- Delete page views older than 90 days
  DELETE FROM page_views 
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Log the cleanup
  RAISE NOTICE 'Cleaned up old page views older than 90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Schedule daily cleanup (using pg_cron extension)
-- Note: This requires pg_cron to be enabled on Supabase
-- ============================================

-- Enable pg_cron extension if available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup to run daily at 2 AM UTC
-- Note: If pg_cron is not available, you can run this manually or via a Vercel cron job
SELECT cron.schedule('delete-old-page-views', '0 2 * * *', 'SELECT delete_old_page_views()');

-- ============================================
-- Add indexes for better query performance
-- ============================================

-- Index for date range queries (analytics dashboard)
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp_desc 
ON page_views(timestamp DESC);

-- Index for path-specific queries
CREATE INDEX IF NOT EXISTS idx_page_views_path_timestamp 
ON page_views(page_path, timestamp);

-- ============================================
-- Add compression/optimization columns (optional)
-- ============================================

-- Add view count column for aggregated data (future use)
-- ALTER TABLE page_views ADD COLUMN view_count INT DEFAULT 1;

-- Add hour bucket for hourly aggregation
ALTER TABLE page_views ADD COLUMN IF NOT EXISTS hour_bucket DATE;

-- Update hour_bucket for existing records
UPDATE page_views 
SET hour_bucket = DATE(timestamp) 
WHERE hour_bucket IS NULL;

-- Index for hourly queries
CREATE INDEX IF NOT EXISTS idx_page_views_hour_bucket 
ON page_views(hour_bucket);

-- ============================================
-- Add comments for documentation
-- ============================================

COMMENT ON TABLE page_views IS 'Analytics: Page view tracking with 90-day retention';
COMMENT ON COLUMN page_views.id IS 'Unique identifier';
COMMENT ON COLUMN page_views.page_path IS 'URL path (e.g., /events, /council)';
COMMENT ON COLUMN page_views.user_id IS 'Optional: User identifier if authenticated';
COMMENT ON COLUMN page_views.timestamp IS 'When the page was viewed';
COMMENT ON COLUMN page_views.referrer IS 'HTTP referrer or null';
COMMENT ON COLUMN page_views.user_agent IS 'Browser user agent string';
COMMENT ON COLUMN page_views.hour_bucket IS 'Date bucket for hourly aggregation';

COMMENT ON FUNCTION delete_old_page_views() IS 'Removes page view records older than 90 days';
