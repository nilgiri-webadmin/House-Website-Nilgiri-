// GET /api/events - Public endpoint to fetch events
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireAuth, requireAdmin } from '../utils/permissions';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

    if (!supabaseClient) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { isPast, limit, category } = req.query;

    let query = supabaseClient
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (isPast !== undefined) {
      query = query.eq('is_past', isPast === 'true');
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (limit) {
      query = query.limit(parseInt(limit as string, 10));
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({ events: data || [] });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch events' });
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
      title,
      description,
      mode,
      category,
      img_url,
      image_url,
      registration_link,
      register_link,
      date,
      time,
      is_past
    } = req.body as any;

    if (!title || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const finalImgUrl = img_url || image_url || null;
    const finalRegistrationLink = registration_link || register_link || null;

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        title,
        description: description || null,
        mode: mode || null,
        category: category || null,
        img_url: finalImgUrl,
        registration_link: finalRegistrationLink,
        date,
        time: time || null,
        is_past: is_past ?? false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ event: data });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: error.message || 'Failed to create event' });
  }
}