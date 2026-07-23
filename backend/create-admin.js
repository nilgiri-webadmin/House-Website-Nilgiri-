/**
 * Script to create a new admin user with a password.
 * Usage: node create-admin.js <email> <password> <name> <role>
 * 
 * Example: node create-admin.js john@example.com SecretPass123 "John Doe" admin
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin User';
const role = process.argv[5] || 'admin';

if (!email || !password) {
  console.error('Usage: node create-admin.js <email> <password> [name] [role]');
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
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existingUser) {
    console.error(`❌ User already exists with email: ${email}`);
    process.exit(1);
  }

  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // Insert the new record
  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      email: email.toLowerCase(),
      password_hash,
      name,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create user:', error.message);
    process.exit(1);
  }

  console.log(`✅ User created successfully!`);
  console.log(`   ID: ${data.id}`);
  console.log(`   Email: ${data.email}`);
  console.log(`   Name: ${data.name}`);
  console.log(`   Role: ${data.role}`);
})();
