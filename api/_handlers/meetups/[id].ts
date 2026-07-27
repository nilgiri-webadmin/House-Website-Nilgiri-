import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireAdmin } from '../utils/permissions';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid meetup ID' });
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
      .from('meetups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Meetup not found' });
      }
      throw error;
    }

    return res.status(200).json({ meetup: data });
  } catch (error: any) {
    console.error('Error fetching meetup:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch meetup' });
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
      insta_link,
      organiser,
      organizer,
      ...rest
    } = updates;

    const updateData: any = { ...rest };

    const finalOrganiser = organiser || organizer;
    const finalImgUrl = img_url || image_url;

    if (finalOrganiser !== undefined) {
      updateData.organiser = finalOrganiser;
    }

    if (finalImgUrl !== undefined) {
      updateData.img_url = finalImgUrl;
    }

    if (register_link !== undefined) {
      updateData.register_link = register_link;
    }

    if (insta_link !== undefined) {
      updateData.insta_link = insta_link;
    }

    delete updateData.id;

    const { data, error } = await supabaseAdmin
      .from('meetups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Meetup not found' });
      }
      throw error;
    }

    return res.status(200).json({ meetup: data });
  } catch (error: any) {
    console.error('Error updating meetup:', error);
    return res.status(500).json({ error: error.message || 'Failed to update meetup' });
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const { error } = await supabaseAdmin
      .from('meetups')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res.status(200).json({ message: 'Meetup deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting meetup:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete meetup' });
  }
}