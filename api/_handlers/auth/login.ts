import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, checkSupabaseConfig } from '../utils/supabase';
import { generateToken } from '../utils/auth';
import bcrypt from 'bcryptjs';
import { rateLimit } from '../utils/rateLimiter';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // limit each IP to 10 requests per windowMs
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return limiter(req, res, async () => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      // Check Supabase configuration
      checkSupabaseConfig();

      if (!supabaseAdmin) {
        console.error('Supabase admin client not initialized');
        return res.status(500).json({ error: 'Database not configured' });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        console.error('Missing email or password in request');
        return res.status(400).json({ error: 'Email and password are required' });
      }

      console.log('Login attempt for email:', email.toLowerCase());

      // Fetch user from database - use * to get all columns
      const { data: user, error } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        console.error('Database error fetching user:', error.message);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user) {
        console.error('User not found for email:', email.toLowerCase());
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('User found, verifying password...');

      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        console.error('Password verification failed for user:', user.email);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      console.log('Login successful for user:', user.email);

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role as 'secretary' | 'webadmin' | 'club',
        clubId: user.club_id || undefined
      });

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          clubId: user.club_id,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
}