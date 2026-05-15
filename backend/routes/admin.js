import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN DEBUG ENDPOINT - Check authentication
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/debug/auth - Debug authentication
router.get('/debug/auth', authenticateToken, (req, res) => {
  console.log('🔐 Auth Debug Info:');
  console.log('User:', req.user);
  
  res.json({
    authenticated: true,
    user: req.user,
    message: 'Token is valid and user info is above'
  });
});

// GET /api/admin/analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // TODO: Add authentication check

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id');

    const { data: meetups, error: meetupsError } = await supabase
      .from('meetups')
      .select('id');

    const { data: clubs, error: clubsError } = await supabase
      .from('clubs')
      .select('id');

    if (eventsError || meetupsError || clubsError) {
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    res.json({
      totalEvents: events?.length || 0,
      totalMeetups: meetups?.length || 0,
      totalClubs: clubs?.length || 0
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN COMMUNITIES CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/communities - Get all communities
router.get('/communities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/communities - Create new community
router.post('/communities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, image, instagram, discord, website } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Community name is required' });
    }

    const { data, error } = await supabase
      .from('communities')
      .insert({
        name,
        description: description || null,
        image: image || null,
        instagram: instagram || null,
        discord: discord || null,
        website: website || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Community created: ${data.id}`);
    res.status(201).json(data);
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/communities/:id - Update community
router.put('/communities/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, image, instagram, discord, website } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (instagram !== undefined) updateData.instagram = instagram;
    if (discord !== undefined) updateData.discord = discord;
    if (website !== undefined) updateData.website = website;

    const { data, error } = await supabase
      .from('communities')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Community not found' });
    }

    console.log(`✅ Community updated: ${data.id}`);
    res.json(data);
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/communities/:id - Delete community
router.delete('/communities/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Community deleted: ${req.params.id}`);
    res.json({ message: 'Community deleted successfully' });
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN EVENTS CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

// GET /api/admin/events - Get all events
router.get('/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/events - Create new event
router.post('/events', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      mode,
      category,
      img_url,
      image_url,
      registration_link,
      register_link,
      date,
      time,
      location,
      is_past
    } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const finalImgUrl = img_url || image_url || null;
    const finalRegistrationLink = registration_link || register_link || null;
    let finalIsPast = false;

    if (typeof is_past === 'boolean') {
      finalIsPast = is_past;
    } else if (typeof is_past === 'string') {
      finalIsPast = is_past === 'true';
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        description: description || null,
        mode: mode || null,
        category: category || null,
        img_url: finalImgUrl,
        registration_link: finalRegistrationLink,
        date,
        time: time || null,
        location: location || null,
        is_past: finalIsPast
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Event created: ${data.id}`);
    res.status(201).json(data);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/events/:id - Update event
router.put('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      image_url,
      img_url,
      register_link,
      registration_link,
      ...rest
    } = req.body;

    const updateData = { ...rest };

    const finalImgUrl = img_url || image_url;
    const finalRegistrationLink = registration_link || register_link;

    if (finalImgUrl !== undefined) {
      updateData.img_url = finalImgUrl;
    }

    if (finalRegistrationLink !== undefined) {
      updateData.registration_link = finalRegistrationLink;
    }

    delete updateData.id;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Event not found' });
    }

    console.log(`✅ Event updated: ${data.id}`);
    res.json(data);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/events/:id - Delete event
router.delete('/events/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    console.log(`✅ Event deleted: ${req.params.id}`);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
