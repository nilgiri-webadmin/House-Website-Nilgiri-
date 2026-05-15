# Supabase Migrations

This directory contains SQL migration files for the Supabase database.

## Running Migrations

### Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `001_enhance_schema.sql`
5. Click **Run** (or press Ctrl+Enter)
6. Verify success message

### Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run migrations:
```bash
supabase db push
```

## Migration Files

- `001_enhance_schema.sql` - Complete database schema (creates all tables)

## What This Migration Does

### Creates Base Tables:
- `achievements` - Student achievements
- `clubs` - Community clubs
- `club_leadership` - Club leadership members
- `council_members` - House council members
- `events` - Event listings
- `meetups` - Regional meetups

### Adds New Columns:
- `events`: category, register_link, image_url
- `meetups`: image_url, register_link
- `clubs`: image_url

### Creates New Tables:
- `admin_users` - Admin authentication
- `page_views` - Analytics tracking
- `event_registrations` - Event signups
- `meetup_registrations` - Meetup signups
- `media_library` - Media metadata

### Sets Up:
- Row Level Security (RLS) policies
- Database indexes for performance
- Foreign key relationships

## Notes

- ✅ **Idempotent**: Safe to run multiple times
- ✅ **Creates tables if they don't exist**: Won't fail if tables already exist
- ✅ **Adds columns safely**: Uses DO blocks to check before adding columns
- ⚠️ **Always backup your database** before running migrations
- ⚠️ **Test migrations** in a development environment first

## Troubleshooting

### Error: "relation already exists"
- This is normal if tables already exist
- The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe

### Error: "column already exists"
- The migration checks for column existence before adding
- If you see this, the column was already added

### Error: "permission denied"
- Make sure you're using the SQL Editor in Supabase dashboard
- Or use service role key with Supabase CLI

## Next Steps

After running the migration:

1. **Create admin user**:
```sql
-- Hash password first using bcrypt (10 rounds)
INSERT INTO admin_users (email, password_hash, role, name)
VALUES (
  'admin@nilgiri.com',
  '$2a$10$YOUR_HASHED_PASSWORD',
  'secretary',
  'Admin User'
);
```

2. **Verify tables**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

3. **Check columns**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events';
```
