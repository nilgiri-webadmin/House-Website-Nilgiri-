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
    return res.status(400).json({ error: 'Invalid achievement ID' });
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
    const { data, error } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return res.status(404).json({ error: 'Achievement not found' });
      }
      throw error;
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching achievement:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch achievement' });
  }
}

async function handlePut(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const { student_name, title, description, date, category, image } =
      req.body as any;

    const { data, error } = await supabaseAdmin
      .from('achievements')
      .update({
        student_name,
        title,
        description,
        date,
        category,
        image
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return res.status(404).json({ error: 'Achievement not found' });
      }
      throw error;
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error updating achievement:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to update achievement' });
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const { error } = await supabaseAdmin
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res
      .status(200)
      .json({ message: 'Achievement deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting achievement:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to delete achievement' });
  }
}

