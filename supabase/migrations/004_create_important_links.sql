-- Create important_links table for storing community resource links
CREATE TABLE IF NOT EXISTS important_links (
  id TEXT PRIMARY KEY DEFAULT ('link_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9)),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_important_links_category ON important_links(category);

-- Create index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_important_links_created_at ON important_links(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_important_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_important_links_updated_at
  BEFORE UPDATE ON important_links
  FOR EACH ROW
  EXECUTE FUNCTION update_important_links_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE important_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to important_links"
  ON important_links
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert important_links"
  ON important_links
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update important_links"
  ON important_links
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated users to delete important_links"
  ON important_links
  FOR DELETE
  USING (true);
