import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../utils/supabase';
import { requireAdmin, AuthRequest } from '../utils/permissions';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'GET') {
    return requireAdmin()(handleGet)(req, res);
  } else if (req.method === 'DELETE') {
    return requireAdmin()(handleDelete)(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req: AuthRequest, res: VercelResponse) {
  try {
    const { limit, offset, category } = req.query;

    let query = supabaseAdmin
      .from('media_library')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (limit) {
      query = query.limit(parseInt(limit as string, 10));
    }

    if (offset) {
      query = query.range(
        parseInt(offset as string, 10),
        parseInt(offset as string, 10) + (parseInt(limit as string, 10) || 20) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({ media: data || [] });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch media' });
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid media ID' });
    }

    // Get file path before deleting
    const { data: media, error: fetchError } = await supabaseAdmin
      .from('media_library')
      .select('file_path')
      .eq('id', id)
      .single();

    if (fetchError || !media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('nilgiri_media')
      .remove([media.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue to delete metadata even if storage delete fails
    }

    // Delete metadata
    const { error: deleteError } = await supabaseAdmin
      .from('media_library')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete media' });
  }
}