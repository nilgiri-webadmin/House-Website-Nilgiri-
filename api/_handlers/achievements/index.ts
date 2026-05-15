import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireRole, AuthRequest } from '../utils/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
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
    return requireRole(['secretary', 'webadmin'])(handlePost)(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('[Achievements GET] Starting request');
    console.log('[Achievements GET] Query params:', req.query);

    const { checkSupabaseConfig } = await import('../utils/supabase.js');
    checkSupabaseConfig();

    if (!supabaseAdmin) {
      console.error('[Achievements GET] Supabase admin not configured');
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { limit, category } = req.query;

    let query = supabaseAdmin
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      console.log('[Achievements GET] Filtering by category:', category);
      query = query.eq('category', category as string);
    }

    if (limit) {
      console.log('[Achievements GET] Limiting to:', limit);
      query = query.limit(parseInt(limit as string, 10));
    }

    console.log('[Achievements GET] Executing query...');
    const { data, error } = await query;

    if (error) {
      console.error('[Achievements GET] Supabase error:', error);
      throw error;
    }

    console.log('[Achievements GET] Success! Found', data?.length || 0, 'achievements');
    if (data && data.length > 0) {
      console.log('[Achievements GET] First achievement:', JSON.stringify(data[0]));
    }

    return res.status(200).json({ achievements: data || [] });
  } catch (error: any) {
    console.error('[Achievements GET] Unexpected error:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch achievements' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  try {
    const { checkSupabaseConfig } = await import('../utils/supabase.js');
    checkSupabaseConfig();

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { student_name, title, description, date, category, image } =
      req.body as any;

    if (!student_name || !title) {
      return res.status(400).json({
        error: 'student_name and title are required'
      });
    }

    const { data, error } = await supabaseAdmin
      .from('achievements')
      .insert({
        student_name,
        title,
        description: description || null,
        date: date || null,
        category: category || null,
        image: image || null
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ achievement: data });
  } catch (error: any) {
    console.error('Error creating achievement:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to create achievement' });
  }
}

