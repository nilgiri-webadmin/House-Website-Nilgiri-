import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireClubAdmin } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/council - Get all council members
router.get('/', async (req, res) => {
  try {
    const { team, region } = req.query;
    
    let query = supabase
      .from('council_members')
      .select('*');

    if (team) {
      query = query.eq('team', team);
    }

    if (region) {
      query = query.eq('region', region);
    }

    const { data, error } = await query.order('position', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get council members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/council/:id - Get single council member
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('council_members')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Council member not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get council member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/council/team/:teamName - Get members by team
router.get('/team/:teamName', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('council_members')
      .select('*')
      .eq('team', req.params.teamName)
      .order('position', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/council/sync-yaml - Sync database to public YAML file (admin only)
router.post('/sync-yaml', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase.from('council_members').select('*');
    if (error) throw error;

    const fs = await import('fs/promises');
    const path = await import('path');
    const yaml = await import('js-yaml');

    const yamlData = {
      niligiri_uhc: [],
      operations: [],
      regional_coordinators: [],
      mentors: [],
      community_admins: []
    };

    data.forEach(member => {
      const entry = {
        name: member.name,
        position: member.position,
        region: member.region,
        image: member.profile_photo_url || ''
      };
      
      const team = member.team || '';
      if (team === 'UHC') yamlData.niligiri_uhc.push(entry);
      else if (team === 'Operations') yamlData.operations.push(entry);
      else if (team === 'RC') yamlData.regional_coordinators.push(entry);
      else if (team === 'Mentor') yamlData.mentors.push(entry);
      else if (team === 'Community Admin' || team === 'Community Admins') yamlData.community_admins.push(entry);
    });

    const yamlString = yaml.dump(yamlData);
    const targetPath = path.join(process.cwd(), '../public/council-data.yml');
    
    await fs.writeFile(targetPath, yamlString, 'utf8');

    res.json({ success: true, stats: { total: data.length } });
  } catch (error) {
    console.error('Sync YAML error:', error);
    res.status(500).json({ error: 'Failed to sync to YAML' });
  }
});

// POST /api/council - Create new council member (admin only)
router.post('/', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Create council request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    // TODO: Add authentication check
    const { name, position, region, team, email, linkedin, profile_photo_url, tenure_year } = req.body;

    if (!name || !position) {
      return res.status(400).json({ 
        error: 'Name and position are required' 
      });
    }

    const insertData = {
      name,
      position,
      region,
      team,
      email,
      linkedin,
      tenure_year,
      created_at: new Date().toISOString()
    };

    if (profile_photo_url !== undefined) insertData.profile_photo_url = profile_photo_url;

    let { data, error } = await supabase
      .from('council_members')
      .insert([insertData])
      .select();

    if (error?.message?.includes('column "profile_photo_url"') && error?.message?.includes('does not exist')) {
      const legacyInsertData = { ...insertData };
      if (legacyInsertData.profile_photo_url !== undefined) {
        legacyInsertData.image = legacyInsertData.profile_photo_url;
        delete legacyInsertData.profile_photo_url;
      }
      const retryResult = await supabase.from('council_members').insert([legacyInsertData]).select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase create council error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Create council member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/council/:id - Update council member (admin only)
router.put('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Update council request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    // TODO: Add authentication check
    const { name, position, region, team, email, linkedin, profile_photo_url, tenure_year } = req.body;

    const updateData = {
      name,
      position,
      region,
      team,
      email,
      linkedin,
      tenure_year,
      updated_at: new Date().toISOString()
    };

    if (profile_photo_url !== undefined) updateData.profile_photo_url = profile_photo_url;

    let { data, error } = await supabase
      .from('council_members')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error?.message?.includes('column "profile_photo_url"') && error?.message?.includes('does not exist')) {
      const legacyUpdateData = { ...updateData };
      if (legacyUpdateData.profile_photo_url !== undefined) {
        legacyUpdateData.image = legacyUpdateData.profile_photo_url;
        delete legacyUpdateData.profile_photo_url;
      }
      const retryResult = await supabase
        .from('council_members')
        .update(legacyUpdateData)
        .eq('id', req.params.id)
        .select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase update council error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Council member not found' });
    }

    res.json(data[0]);
  } catch (error) {
    console.error('Update council member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/council/:id - Delete council member (admin only)
router.delete('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    // TODO: Add authentication check
    const memberId = req.params.id;
    
    const { error } = await supabase
      .from('council_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete council member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
