import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireRole, AuthRequest } from '../utils/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid community ID' });
  }

  if (req.method === 'GET') {
    return handleGet(id, res);
  } else if (req.method === 'PUT') {
    return requireRole(['secretary', 'webadmin'])(handlePut)(req, res);
  } else if (req.method === 'DELETE') {
    return requireRole(['secretary', 'webadmin'])(handleDelete)(req, res);
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
      if ((error as any).code === 'PGRST116') {
        return res.status(404).json({ error: 'Community not found' });
      }
      throw error;
    }

    return res.status(200).json({ community: data });
  } catch (error: any) {
    console.error('Error fetching community:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch community' });
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
      if ((error as any).code === 'PGRST116') {
        return res.status(404).json({ error: 'Community not found' });
      }
      throw error;
    }

    return res.status(200).json({ community: data });
  } catch (error: any) {
    console.error('Error updating community:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to update community' });
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
    return res
      .status(500)
      .json({ error: error.message || 'Failed to delete community' });
  }
}

