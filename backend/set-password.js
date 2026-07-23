/**
 * One-time script to set a password for an existing admin user.
 * Usage: node set-password.js <email> <new-password>
 * 
 * This adds a password_hash to the admin_users record so the user
 * can log in with either Google OAuth OR email/password.
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node set-password.js <email> <new-password>');
  console.error('Example: node set-password.js admin@example.com MySecurePass123');
  process.exit(1);
}

if (password.length < 6) {
  console.error('Password must be at least 6 characters.');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Check if user exists
  const { data: user, error: findError } = await supabase
    .from('admin_users')
    .select('id, email, name, role')
    .eq('email', email)
    .single();

  if (findError || !user) {
    console.error(`❌ No admin user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Found user: ${user.name} (${user.email}) — role: ${user.role}`);

  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // Update the record
  const { error: updateError } = await supabase
    .from('admin_users')
    .update({ password_hash })
    .eq('id', user.id);

  if (updateError) {
    console.error('❌ Failed to update password:', updateError.message);
    process.exit(1);
  }

  console.log(`✅ Password set successfully for ${user.email}`);
  console.log('   You can now log in with either Google OAuth or email/password.');
})();
