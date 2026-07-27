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
    const { isPast, limit, offset } = req.query;
    const pageSize = limit ? parseInt(limit as string, 10) : 12;
    const pageOffset = offset ? parseInt(offset as string, 10) : 0;

    // First, get the total count with the filter applied
    let countQuery = supabaseClient
      .from('meetups')
      .select('*', { count: 'exact', head: true });

    if (isPast !== undefined) {
      countQuery = countQuery.eq('is_past', isPast === 'true');
    }

    const { count: totalCount } = await countQuery;

    // Now get the data with pagination
    let dataQuery = supabaseClient
      .from('meetups')
      .select('*')
      .order('meetup_number', { ascending: false });

    if (isPast !== undefined) {
      dataQuery = dataQuery.eq('is_past', isPast === 'true');
    }

    // Apply pagination
    dataQuery = dataQuery.range(pageOffset, pageOffset + pageSize - 1);

    const { data, error } = await dataQuery;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      meetups: data || [],
      total: totalCount || 0,
      hasMore: totalCount ? (pageOffset + pageSize) < totalCount : false
    });
  } catch (error: any) {
    console.error('Error fetching meetups:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  try {
    const {
      title,
      description,
      meetup_number,
      location,
      date,
      time,
      organiser,
      organizer,
      insta_link,
      img_url,
      image_url,
      register_link,
      is_past
    } = req.body as any;

    const finalOrganiser = organiser || organizer;
    const finalImgUrl = img_url || image_url;

    if (!title || !date || !time || !location || !finalOrganiser) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabaseAdmin
      .from('meetups')
      .insert({
        title,
        description: description || null,
        meetup_number: meetup_number ?? null,
        location,
        date,
        time,
        organiser: finalOrganiser,
        insta_link: insta_link || null,
        img_url: finalImgUrl || null,
        register_link: register_link || null,
        is_past: is_past ?? false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return res.status(201).json({ meetup: data });
  } catch (error: any) {
    console.error('Error creating meetup:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}