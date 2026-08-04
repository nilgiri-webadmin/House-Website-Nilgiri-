import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../utils/supabase';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { team } = req.query;

    if (!team || typeof team !== 'string') {
      return res.status(400).json({ error: 'Invalid team name' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabaseAdmin
      .from('council_members')
      .select('*')
      .eq('team', team)
      .order('position', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json({ council: data || [] });
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch team members' });
  }
}