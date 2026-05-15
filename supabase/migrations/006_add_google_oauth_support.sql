-- Migration: Add Google OAuth support to admin_users table
-- This migration adds OAuth-related columns and creates the allowed_oauth_emails whitelist table

-- Add OAuth columns to admin_users table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS oauth_provider TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS oauth_id TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS oauth_picture_url TEXT;

-- Make password_hash nullable since OAuth users won't have passwords
ALTER TABLE admin_users ALTER COLUMN password_hash DROP NOT NULL;

-- Add unique constraint for oauth combinations to prevent duplicate accounts
ALTER TABLE admin_users ADD CONSTRAINT unique_oauth_provider_id 
  UNIQUE (oauth_provider, oauth_id);

-- Create allowed_oauth_emails table for whitelisting authorized admin emails
CREATE TABLE IF NOT EXISTS allowed_oauth_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'secretary' CHECK (role IN ('secretary', 'webadmin', 'club')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add RLS (Row Level Security) to allowed_oauth_emails table
ALTER TABLE allowed_oauth_emails ENABLE ROW LEVEL SECURITY;

-- Create policy for reading allowed emails (public read - admins need to see if they're allowed)
CREATE POLICY "Allowed emails are viewable by everyone" ON allowed_oauth_emails
  FOR SELECT USING (true);

-- Seed with your authorized admin emails (UPDATE THESE WITH YOUR ACTUAL EMAILS)
INSERT INTO allowed_oauth_emails (email, role) VALUES
  ('admin@example.com', 'secretary'),
  ('webadmin@example.com', 'webadmin'),
  ('clubadmin@example.com', 'club')
ON CONFLICT (email) DO NOTHING;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_allowed_oauth_emails_email 
  ON allowed_oauth_emails(email);

-- Create index on oauth combinations for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_oauth 
  ON admin_users(oauth_provider, oauth_id);

-- Add comment to document the new columns
COMMENT ON TABLE allowed_oauth_emails IS 'Whitelist of email addresses authorized to login via Google OAuth';
COMMENT ON COLUMN admin_users.oauth_provider IS 'OAuth provider name (e.g., "google")';
COMMENT ON COLUMN admin_users.oauth_id IS 'OAuth provider user ID';
COMMENT ON COLUMN admin_users.oauth_picture_url IS 'User profile picture URL from OAuth provider';
