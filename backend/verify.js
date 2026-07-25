import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('allowed_oauth_emails').select('*').eq('email', '25f3002130@ds.study.iitm.ac.in');
  console.log('OAuth Whitelist:', data);
  const { data: admin } = await supabase.from('admin_users').select('email,role,is_active').eq('email', '25f3002130@ds.study.iitm.ac.in');
  console.log('Admin Users:', admin);
}
run();
