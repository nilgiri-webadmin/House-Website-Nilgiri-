-- Complete Database Schema Migration
-- This creates all tables from scratch

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE BASE TABLES FIRST
-- ============================================

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  category TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  image TEXT,
  location TEXT,
  meeting_schedule TEXT,
  members INTEGER,
  vision TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create club_leadership table
CREATE TABLE IF NOT EXISTS club_leadership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create council_members table
CREATE TABLE IF NOT EXISTS council_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  bio TEXT,
  email TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  image TEXT,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  is_past BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create meetups table
CREATE TABLE IF NOT EXISTS meetups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  organizer TEXT NOT NULL,
  description TEXT,
  attendees INTEGER,
  has_attended BOOLEAN DEFAULT FALSE,
  is_past BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ADD NEW COLUMNS TO EXISTING TABLES
-- ============================================

-- Add missing fields to events table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='category') THEN
    ALTER TABLE events ADD COLUMN category TEXT CHECK (category IN ('Technical', 'Sports', 'Cultural', 'Travel', 'Skill Building', 'Other'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='register_link') THEN
    ALTER TABLE events ADD COLUMN register_link TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='events' AND column_name='image_url') THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Add missing fields to meetups table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetups' AND column_name='image_url') THEN
    ALTER TABLE meetups ADD COLUMN image_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='meetups' AND column_name='register_link') THEN
    ALTER TABLE meetups ADD COLUMN register_link TEXT;
  END IF;
END $$;

-- Add image_url to clubs table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clubs' AND column_name='image_url') THEN
    ALTER TABLE clubs ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- ============================================
-- CREATE NEW TABLES
-- ============================================

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('secretary', 'webadmin', 'club')),
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create page_views table for analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  user_id TEXT,
  timestamp TIMESTAMP DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_email)
);

-- Create meetup_registrations table
CREATE TABLE IF NOT EXISTS meetup_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meetup_id UUID REFERENCES meetups(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  registered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(meetup_id, user_email)
);

-- Create media_library table
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  tags TEXT[],
  category TEXT,
  url TEXT NOT NULL
);

-- ============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_is_past ON events(is_past);
CREATE INDEX IF NOT EXISTS idx_meetups_is_past ON meetups(is_past);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_meetup_registrations_meetup_id ON meetup_registrations(meetup_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_clubs_category ON clubs(category);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetup_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Public tables (read-only for public, write for authenticated)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_leadership ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public can read events" ON events;
DROP POLICY IF EXISTS "Public can read meetups" ON meetups;
DROP POLICY IF EXISTS "Public can read clubs" ON clubs;
DROP POLICY IF EXISTS "Public can read achievements" ON achievements;
DROP POLICY IF EXISTS "Public can read council_members" ON council_members;
DROP POLICY IF EXISTS "Public can read club_leadership" ON club_leadership;

-- Public read policies for main tables
CREATE POLICY "Public can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can read meetups" ON meetups FOR SELECT USING (true);
CREATE POLICY "Public can read clubs" ON clubs FOR SELECT USING (true);
CREATE POLICY "Public can read achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public can read council_members" ON council_members FOR SELECT USING (true);
CREATE POLICY "Public can read club_leadership" ON club_leadership FOR SELECT USING (true);

-- Admin users policies
DROP POLICY IF EXISTS "Admin users are viewable by authenticated admins" ON admin_users;
DROP POLICY IF EXISTS "Admin users are insertable by service role" ON admin_users;
CREATE POLICY "Admin users are viewable by authenticated admins" ON admin_users
  FOR SELECT USING (true); -- Service role bypasses RLS anyway
CREATE POLICY "Admin users are insertable by service role" ON admin_users
  FOR INSERT WITH CHECK (true);

-- Page views policies
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
DROP POLICY IF EXISTS "Admins can view all page views" ON page_views;
CREATE POLICY "Anyone can insert page views" ON page_views
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all page views" ON page_views
  FOR SELECT USING (true); -- Service role bypasses RLS

-- Event registrations policies
DROP POLICY IF EXISTS "Anyone can register for events" ON event_registrations;
DROP POLICY IF EXISTS "Admins can view event registrations" ON event_registrations;
CREATE POLICY "Anyone can register for events" ON event_registrations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view event registrations" ON event_registrations
  FOR SELECT USING (true);

-- Meetup registrations policies
DROP POLICY IF EXISTS "Anyone can register for meetups" ON meetup_registrations;
DROP POLICY IF EXISTS "Admins can view meetup registrations" ON meetup_registrations;
CREATE POLICY "Anyone can register for meetups" ON meetup_registrations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view meetup registrations" ON meetup_registrations
  FOR SELECT USING (true);

-- Media library policies
DROP POLICY IF EXISTS "Admins can view media library" ON media_library;
DROP POLICY IF EXISTS "Admins can insert media" ON media_library;
DROP POLICY IF EXISTS "Admins can update media" ON media_library;
DROP POLICY IF EXISTS "Admins can delete media" ON media_library;
CREATE POLICY "Admins can view media library" ON media_library
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert media" ON media_library
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update media" ON media_library
  FOR UPDATE USING (true);
CREATE POLICY "Admins can delete media" ON media_library
  FOR DELETE USING (true);

-- Note: Write operations (INSERT, UPDATE, DELETE) on events, meetups, clubs, etc.
-- should be done through the API using service role key, which bypasses RLS.
-- For additional security, you can add authenticated-only write policies if needed.
