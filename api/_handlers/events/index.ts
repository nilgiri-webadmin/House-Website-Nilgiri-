import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireAuth, requireAdmin } from '../utils/permissions';

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
        is_pad: is_past ?? false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ event: data });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}