import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireClubAdmin } from '../middleware/auth.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/', async (req, res) => {
  try {
    const { isPast, category, limit } = req.query;

    let query = supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });

    if (isPast !== undefined) {
      query = query.eq('is_past', isPast === 'true');
    }

    if (category) {
      query = query.eq('category', category);
    }

    let limitNumber = 10;

    if (typeof limit === 'string') {
      const parsedLimit = parseInt(limit, 10);
      if (!Number.isNaN(parsedLimit)) {
        limitNumber = parsedLimit;
      }
    }

    query = query.limit(limitNumber);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ events: data || [] });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({ event: data });
  } catch (error) {
    console.error('Get event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Create event request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
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
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const finalImgUrl = img_url || image_url || null;
    const finalRegistrationLink = registration_link || register_link || null;

    let finalIsPast = false;

    if (typeof is_past === 'boolean') {
      finalIsPast = is_past;
    } else if (typeof is_past === 'string') {
      finalIsPast = is_past === 'true';
    }

    const insertData = {
      title,
      description: description || null,
      mode: mode || null,
      category: category || null,
      date,
      time: time || null,
      location: location || null,
      is_past: finalIsPast
    };

    if (finalImgUrl !== undefined) insertData.img_url = finalImgUrl;
    if (finalRegistrationLink !== undefined) insertData.registration_link = finalRegistrationLink;

    let { data, error } = await supabase
      .from('events')
      .insert(insertData)
      .select()
      .single();

    if (error?.message?.includes('column "img_url"') && error?.message?.includes('does not exist')) {
      const legacyInsertData = { ...insertData };
      if (legacyInsertData.img_url !== undefined) {
        legacyInsertData.image = legacyInsertData.img_url;
        delete legacyInsertData.img_url;
      }
      if (legacyInsertData.registration_link !== undefined) {
        legacyInsertData.register_link = legacyInsertData.registration_link;
        delete legacyInsertData.registration_link;
      }
      const retryResult = await supabase.from('events').insert(legacyInsertData).select().single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase create event error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ event: data });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Update event request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
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

    if (updateData.mode === '') updateData.mode = null;
    if (updateData.category === '') updateData.category = null;
    if (updateData.location === '') updateData.location = null;

    delete updateData.id;

    let { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error?.message?.includes('column "img_url"') && error?.message?.includes('does not exist')) {
      const legacyUpdateData = { ...updateData };
      if (legacyUpdateData.img_url !== undefined) {
        legacyUpdateData.image = legacyUpdateData.img_url;
        delete legacyUpdateData.img_url;
      }
      if (legacyUpdateData.registration_link !== undefined) {
        legacyUpdateData.register_link = legacyUpdateData.registration_link;
        delete legacyUpdateData.registration_link;
      }
      const retryResult = await supabase
        .from('events')
        .update(legacyUpdateData)
        .eq('id', req.params.id)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase update event error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({ event: data });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
