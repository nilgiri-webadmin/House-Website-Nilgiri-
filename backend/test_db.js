import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('communities').select('*').limit(1);
  console.log('Columns:', Object.keys(data[0]));
  const { data: updateData, error: updateError } = await supabase.from('communities').update({ lead: 'Test', joining_form: 'test', instagram: 'test' }).eq('id', data[0].id).select();
  if (updateError) console.error('Update error:', updateError);
  else console.log('Update success');
}
test();
