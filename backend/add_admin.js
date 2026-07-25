import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const email = '25f3002130@ds.study.iitm.ac.in';
  
  const { data, error } = await supabase.from('admin_users').update({ role: 'webadmin' }).eq('email', email).select();
  if (error) console.log('Error updating admin_users:', error.message);
  else console.log('Updated admin_users:', data);
}
run();
