-- New Simplified Database Schema
-- Migration: Replace complex schema with simplified tables
-- Date: 2026-01-17

-- ============================================
-- DROP EXISTING TABLES (in reverse order of dependencies)
-- ============================================
DROP TABLE IF EXISTS club_leadership CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS meetups CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS council_members CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ============================================
-- CREATE EXTENSION (if not exists)
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ADMIN USERS TABLE (for authentication)
-- ============================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'secretary', 'webadmin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_email ON admin_users(email);

-- ============================================
-- 2. COMMUNITIES TABLE (7 communities)
-- ============================================
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  lead TEXT NOT NULL,
  joining_form TEXT, -- URL to the form
  events TEXT, -- Comma-separated event IDs or JSON array
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sample communities (you can insert these)
-- INSERT INTO communities (name, lead, description) VALUES
-- ('Community 1', 'Lead Name', 'Description'),
-- ('Community 2', 'Lead Name', 'Description'),
-- etc...

-- ============================================
-- 3. COUNCIL MEMBERS TABLE
-- ============================================
CREATE TABLE council_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  region TEXT,
  team TEXT CHECK (team IN ('UHC', 'Multimedia', 'WebOps', 'RC')),
  email TEXT,
  linkedin TEXT, -- LinkedIn URL
  profile_photo_url TEXT,
  tenure_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_council_members_position ON council_members(position);
CREATE INDEX idx_council_members_team ON council_members(team);

-- ============================================
-- 4. EVENTS TABLE
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN ('offline', 'online', 'hybrid')),
  category TEXT,
  img_url TEXT,
  registration_link TEXT,
  date DATE NOT NULL,
  time TIME,
  is_past BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_is_past ON events(is_past);
CREATE INDEX idx_events_category ON events(category);

-- ============================================
-- 5. MEETUPS TABLE
-- ============================================
CREATE TABLE meetups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  meetup_number INTEGER,
  location TEXT,
  date DATE NOT NULL,
  time TIME,
  organiser TEXT, -- Region or organizer name
  is_past BOOLEAN DEFAULT FALSE,
  insta_link TEXT,
  img_url TEXT,
  register_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meetups_date ON meetups(date);
CREATE INDEX idx_meetups_is_past ON meetups(is_past);
CREATE INDEX idx_meetups_organiser ON meetups(organiser);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

-- Public can read communities, council members, events, meetups
CREATE POLICY "Public read communities" ON communities FOR SELECT USING (true);
CREATE POLICY "Public read council_members" ON council_members FOR SELECT USING (true);
CREATE POLICY "Public read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public read meetups" ON meetups FOR SELECT USING (true);

-- Only authenticated admins can modify data
-- (You'll need to set up proper JWT claims for this)
-- CREATE POLICY "Admin only" ON communities FOR ALL USING (current_setting('request.jwt.claims')::json->>'role' = 'admin');

-- ============================================
-- SAMPLE DATA (optional - uncomment to use)
-- ============================================

-- Sample admin user (password should be hashed in production)
-- INSERT INTO admin_users (email, password, name, role) 
-- VALUES ('admin@nilgiri.com', '$2a$10$...', 'Admin User', 'admin');

-- Sample communities
-- INSERT INTO communities (name, lead, description, joining_form)
-- VALUES 
--   ('Tech Club', 'Alice', 'For tech enthusiasts', 'https://forms.example.com/tech'),
--   ('Science Club', 'Bob', 'For science lovers', 'https://forms.example.com/science'),
--   ('Arts Club', 'Charlie', 'For artists', 'https://forms.example.com/arts'),
--   ('Sports Club', 'Diana', 'For sports', 'https://forms.example.com/sports'),
--   ('Music Club', 'Eve', 'For musicians', 'https://forms.example.com/music'),
--   ('Drama Club', 'Frank', 'For actors', 'https://forms.example.com/drama'),
--   ('Debate Club', 'Grace', 'For debaters', 'https://forms.example.com/debate');

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE admin_users IS 'Admin users for dashboard authentication';
COMMENT ON TABLE communities IS '7 main communities in the organization';
COMMENT ON TABLE council_members IS 'Council members with their roles and regions';
COMMENT ON TABLE events IS 'Events organized by the institution';
COMMENT ON TABLE meetups IS 'Meetups organized by communities';

COMMENT ON COLUMN admin_users.role IS 'admin, secretary, or webadmin';
COMMENT ON COLUMN events.mode IS 'offline, online, or hybrid event';
COMMENT ON COLUMN council_members.team IS 'UHC, Multimedia, WebOps, or RC';
COMMENT ON COLUMN meetups.is_past IS 'Auto-updated based on date comparison';
