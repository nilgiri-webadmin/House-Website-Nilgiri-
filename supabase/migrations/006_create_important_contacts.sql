-- Create important_contacts table for student administration contacts
CREATE TABLE IF NOT EXISTS important_contacts (
  id TEXT PRIMARY KEY DEFAULT ('contact_' || extract(epoch from now())::bigint || '_' || substr(md5(random()::text), 1, 9)),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_important_contacts_role ON important_contacts(role);
CREATE INDEX IF NOT EXISTS idx_important_contacts_created_at ON important_contacts(created_at DESC);

CREATE OR REPLACE FUNCTION update_important_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_important_contacts_updated_at
  BEFORE UPDATE ON important_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_important_contacts_updated_at();

ALTER TABLE important_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to important_contacts"
  ON important_contacts
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert important_contacts"
  ON important_contacts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update important_contacts"
  ON important_contacts
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow authenticated users to delete important_contacts"
  ON important_contacts
  FOR DELETE
  USING (true);
