import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, checkSupabaseConfig } from '../utils/supabase';
import { generateToken } from '../utils/auth';
import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

    if (!GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID not configured');
      return res.status(500).json({ error: 'OAuth not configured on server' });
    }

    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google token required' });
    }

    console.log('Verifying Google token...');

    // Verify Google token
    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload?.email?.trim();
    const googleId = payload?.sub;
    const name = payload?.name;
    const picture = payload?.picture;

    if (!email || !googleId) {
      console.error('Invalid Google token payload');
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const normalizedEmail = email.toLowerCase();

    console.log('Google token verified for email:', normalizedEmail);

    // Check if email is in whitelist
    const { data: allowedEmail, error: allowedError } = await supabaseAdmin
      .from('allowed_oauth_emails')
      .select('*')
      .ilike('email', normalizedEmail)
      .single();

    if (allowedError || !allowedEmail) {
      console.error('Email not in whitelist:', normalizedEmail);
      return res.status(403).json({
        error: `Email not authorized: ${normalizedEmail}. Please add it to the Google OAuth whitelist.`,
      });
    }

    console.log('Email whitelisted with role:', allowedEmail.role);

    // Find existing admin user with this OAuth ID
    let { data: adminUser, error: findError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('oauth_provider', 'google')
      .eq('oauth_id', googleId)
      .single();

    if (!adminUser) {
      console.log('Creating new admin user for email:', normalizedEmail);

      // Create new admin user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          email: normalizedEmail,
          oauth_provider: 'google',
          oauth_id: googleId,
          oauth_picture_url: picture,
          name,
          role: allowedEmail.role,
        })
        .select()
        .single();

      if (createError) {
        console.error('Create user error:', createError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      adminUser = newUser;
      console.log('Admin user created:', adminUser.id);
    } else {
      console.log('Found existing admin user:', adminUser.id);

      // Update last login and picture
      await supabaseAdmin
        .from('admin_users')
        .update({
          oauth_picture_url: picture,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adminUser.id);
    }

    // Generate JWT token
    const token = generateToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role as 'secretary' | 'webadmin' | 'club',
      clubId: adminUser.club_id || undefined
    });

    console.log('JWT token generated for user:', adminUser.id);

    return res.status(200).json({
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        picture: adminUser.oauth_picture_url,
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}
