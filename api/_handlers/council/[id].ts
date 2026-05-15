import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin, supabaseClient } from '../utils/supabase';
import { requireRole, AuthRequest } from '../utils/auth';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid council member ID' });
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
      .from('council_members')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return res.status(404).json({ error: 'Council member not found' });
      }
      throw error;
    }

    return res.status(200).json({ member: data });
  } catch (error: any) {
    console.error('Error fetching council member:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to fetch council member' });
  }
}

async function handlePut(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const {
      name,
      position,
      region,
      team,
      email,
      linkedin,
      profile_photo_url,
      tenure_year
    } = req.body as any;

    const { data, error } = await supabaseAdmin
      .from('council_members')
      .update({
        name,
        position,
        region,
        team,
        email,
        linkedin,
        profile_photo_url,
        tenure_year,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        return res.status(404).json({ error: 'Council member not found' });
      }
      throw error;
    }

    return res.status(200).json({ member: data });
  } catch (error: any) {
    console.error('Error updating council member:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to update council member' });
  }
}

async function handleDelete(req: AuthRequest, res: VercelResponse) {
  try {
    const { id } = req.query;

    const { error } = await supabaseAdmin
      .from('council_members')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return res
      .status(200)
      .json({ message: 'Council member deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting council member:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to delete council member' });
  }
}

// Helper function to sync council data to YAML
async function syncCouncilToYaml(councilData: any) {
  try {
    const yamlPath = path.join(process.cwd(), 'public/council-data.yml');
    const fileContent = await fs.readFile(yamlPath, 'utf-8');
    const content = yaml.load(fileContent) as any || {};

    // Get team key for this member
    const teamMap: { [key: string]: string } = {
      'UHC': 'niligiri_uhc',
      'Multimedia + WebOps': 'multimedia_team',
      'RC': 'regional_coordinators',
      'Community Admin': 'community_admins',
      'Mentors': 'mentors'
    };
    const teamKey = teamMap[councilData.team] || 'niligiri_uhc';
  } catch (error: any) {

