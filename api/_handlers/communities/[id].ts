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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PUT,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid community ID' });
  }

  if (req.method === 'GET') {
    return handleGet(id, res);
  } else if (req.method === 'PUT') {
    return requireAdmin()(handlePut)(req, res);
  } else if (req.method === 'DELETE') {
    return requireAdmin()(handleDelete)(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(id: string, res: VercelResponse) {
  try {
    const { data, error } = await supabaseClient
      .from('communities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Community not found' });
      }
      throw error;
    }

    return res.status(200).json({ community: data });
  } catch (error: any) {
    console.error('Error fetching community:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handlePut(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const { name, description, lead, joining_form, events, image } =
      req.body as any;

    const { data, error } = await supabaseAdmin
      .from('communities')
      .update({
        name,
        description,
        lead,
        joining_form,
        events,
        image
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Community not found' });
      }
      throw error;
    }

    return res.status(200).json({ community: data });
  } catch (error: any) {
    console.error('Error updating community:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const { error } = await supabaseAdmin
      .from('communities')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: 'Community deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting community:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}