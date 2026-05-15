import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireRole, AuthRequest } from '../utils/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid event ID' });
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
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Event not found' });
      }
      throw error;
    }

    return res.status(200).json({ event: data });
  } catch (error: any) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch event' });
  }
}

async function handlePut(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;
    const updates = req.body as any;

    const {
      image_url,
      img_url,
      register_link,
      registration_link,
      ...rest
    } = updates;

    const updateData: any = { ...rest };

    const finalImgUrl = img_url || image_url;
    const finalRegistrationLink = registration_link || register_link;

    if (finalImgUrl !== undefined) {
      updateData.img_url = finalImgUrl;
    }

    if (finalRegistrationLink !== undefined) {
      updateData.registration_link = finalRegistrationLink;
    }

    delete updateData.id;

    const { data, error } = await supabaseAdmin
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Event not found' });
      }
      throw error;
    }

    return res.status(200).json({ event: data });
  } catch (error: any) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: error.message || 'Failed to update event' });
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete event' });
  }
}
