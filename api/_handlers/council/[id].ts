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
    return res.status(400).json({ error: 'Invalid council member ID' });
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

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching council member:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error updating council member:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

    return res.status(200).json({ message: 'Council member deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting council member:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to sync council data to YAML
async function syncCouncilToYaml(councilData: any) {
  try {
    const { resolve } = await import('path');
    const { readFile, writeFile } = await import('fs');
    const yaml = await import('js-yaml');

    const yamlPath = resolve(process.cwd(), 'public/council-data.yml');
    const fileContent = await readFile(yamlPath, 'utf-8');
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

    // Update the specific council member in the YAML
    if (content[teamKey] && Array.isArray(content[teamKey])) {
      const memberIndex = content[teamKey].findIndex((m: any) => m.id === councilData.id);
      if (memberIndex !== -1) {
        content[teamKey][memberIndex] = {
          id: councilData.id,
          name: councilData.name,
          position: councilData.position,
          region: councilData.region,
          email: councilData.email,
          linkedin: councilData.linkedin,
          profile_photo_url: councilData.profile_photo_url,
          tenure_year: councilData.tenure_year
        };

        try {
          await writeFile(yamlPath, yaml.dump(content), 'utf-8');
        } catch (writeError: any) {
          console.warn('Unable to write council YAML update in read-only environment:', writeError);
        }
      }
    }
  } catch (error: any) {
    console.warn('Could not sync council data to YAML:', error);
    // Don't fail the request if YAML sync fails
  }
}