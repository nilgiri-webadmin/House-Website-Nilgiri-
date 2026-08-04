import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireAdmin } from '../utils/permissions';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return requireAdmin()(handlePost)(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const { checkSupabaseConfig } = await import('../utils/supabase.js');
    checkSupabaseConfig();

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { team, region } = req.query;

    let query = supabaseAdmin
      .from('council_members')
      .select('*');

    if (team) {
      query = query.eq('team', team as string);
    }

    if (region) {
      query = query.eq('region', region as string);
    }

    const { data, error } = await query.order('position', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json(data || []);
  } catch (error: any) {
    console.error('Error fetching council members:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  try {
    const { checkSupabaseConfig } = await import('../utils/supabase.js');
    checkSupabaseConfig();

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const {
      name,
      position,
      region,
      team,
      email,
      linkedin,
      profile_photo_url,
      tenure_year
    } = req.body as any;

    if (!name || !position) {
      return res.status(400).json({
        error: 'Name and position are required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('council_members')
      .insert({
        name,
        position,
        region,
        team,
        email,
        linkedin,
        profile_photo_url,
        tenure_year
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creating council member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}