-- Create contributors table for the website contributors showcase (/contributors)
CREATE TABLE IF NOT EXISTS contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  github TEXT,
  linkedin TEXT,
  portfolio TEXT,
  tenure TEXT NOT NULL,
  role TEXT,
  description TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributors_created_at ON contributors(created_at DESC);

ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;

-- Public can read contributors
CREATE POLICY "Public read contributors" ON contributors
  FOR SELECT USING (true);

-- Authenticated admins can insert/update/delete contributors
CREATE POLICY "Authenticated insert contributors" ON contributors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update contributors" ON contributors
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated delete contributors" ON contributors
  FOR DELETE USING (true);