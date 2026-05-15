-- Migration: Add instagram column to communities table
-- Date: 2026-02-02

ALTER TABLE communities ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Update comments
COMMENT ON COLUMN communities.instagram IS 'Instagram profile URL for the community';
