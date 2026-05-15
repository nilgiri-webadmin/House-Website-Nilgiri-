import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireRole, AuthRequest } from '../utils/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return requireRole(['secretary', 'webadmin'])(handlePost)(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const { checkSupabaseConfig } = await import('../utils/supabase.js');
    checkSupabaseConfig();

    if (!supabaseClient) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabaseClient
      .from('communities')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    // Return as array for frontend compatibility with Express backend
    // Frontend handles both formats with: Array.isArray(data) ? data : data.communities
    return res.status(200).json(data || []);
  } catch (error: any) {
    console.error('Error fetching communities:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch communities' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  try {
    const { checkSupabaseConfig } = await import('../utils/supabase.js');
    checkSupabaseConfig();

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { name, description, lead, joining_form, events, image } =
      req.body as any;

    if (!name || !description || !lead) {
      return res.status(400).json({
        error: 'Name, description, and lead are required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('communities')
      .insert({
        name,
        description,
        lead,
        joining_form,
        events: events || null,
        image: image || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ community: data });
  } catch (error: any) {
    console.error('Error creating community:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to create community' });
  }
}

