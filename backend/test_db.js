import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('communities').select('*').limit(1);
  if (!data || data.length === 0) return console.log('No data');
  const community = data[0];
  
  const updateData = { lead: 'Test Lead', joining_form: 'test-form', events: null, image: null };
  const { data: updated, error: updateError } = await supabase.from('communities').update(updateData).eq('id', community.id).select().single();
  
  if (updateError) console.error('Update error:', updateError);
  else console.log('Update success:', updated);
}
test();
