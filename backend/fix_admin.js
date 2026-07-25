import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const email = '25f3002130@ds.study.iitm.ac.in';

  // 1. Delete existing admin_users entry
  const { error: delError } = await supabase
    .from('admin_users')
    .delete()
    .eq('email', email);

  if (delError) {
    console.error('Delete failed:', delError.message);
    return;
  }
  console.log('✅ Deleted old admin_users entry');

  // 2. Verify it's gone
  const { data: check } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email);
  console.log('Remaining rows for email:', check);

  // 3. Confirm whitelist entry still exists
  const { data: oauth } = await supabase
    .from('allowed_oauth_emails')
    .select('*')
    .eq('email', email);
  console.log('OAuth whitelist entry:', oauth);
}
run();
