import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseClient } from '../utils/supabase';
import { requireAdmin } from '../utils/permissions';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'POST') {
    return requireAdmin()(handlePost)(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePost(req: AuthRequest, res: VercelResponse) {
  try {
    // Fetch all council members from database
    const { data: members, error } = await supabaseClient
      .from('council_members')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      throw error;
    }

    // Transform database data to YAML structure
    const yamlData: any = {
      niligiri_uhc: [],
      operations: [],
      regional_coordinators: [],
      community_admins: [],
      mentors: []
    };

    // Team mapping from DB to YAML categories
    const teamMap: Record<string, string> = {
      'UHC': 'niligiri_uhc',
      'Multimedia': 'operations',
      'WebOps': 'operations',
      'RC': 'regional_coordinators',
      'Community Admin': 'community_admins',
      'Community Admins': 'community_admins',
      'Mentor': 'mentors',
      'Mentors': 'mentors',
      'Operations': 'operations'
    };

    // Transform each member to YAML format
    members?.forEach((member: any) => {
      const teamKey = teamMap[member.team] || 'niligiri_uhc';

      const yamlMember = {
        id: member.id,
        name: member.name,
        position: member.position,
        image: member.profile_photo_url || '',
        email: member.email || '',
        linkedin: member.linkedin || '',
        region: member.region || '',
        team: member.team,
        tenure: member.tenure_year ? `${member.tenure_year.toString().slice(-2)}-${(member.tenure_year + 1).toString().slice(-2)}` : ''
      };

      yamlData[teamKey].push(yamlMember);
    });

    // Generate YAML content
    const yamlContent = yaml.dump(yamlData, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });

    // Attempt to write a static copy for local development, but do not fail in read-only production environments.
    const yamlPath = join(process.cwd(), 'public', 'council-data.yml');
    try {
      writeFileSync(yamlPath, yamlContent, 'utf-8');
    } catch (writeError: any) {
      console.warn('Unable to write council YAML to public folder; continuing without static file save.', writeError);
    }

    return res.status(200).json({
      success: true,
      message: 'Council data synced successfully',
      yamlSaved: false,
      stats: {
        total: members?.length || 0,
        uhc: yamlData.niligiri_uhc.length,
        operations: yamlData.operations.length,
        rc: yamlData.regional_coordinators.length,
        admins: yamlData.community_admins.length,
        mentors: yamlData.mentors.length
      }
    });

  } catch (error: any) {
    console.error('Error syncing council to YAML:', error);
    return res.status(500).json({
      error: error.message || 'Failed to sync council data to YAML'
    });
  }
}