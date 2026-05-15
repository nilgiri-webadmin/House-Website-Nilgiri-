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
    const { isPast, limit } = req.query;

    let query = supabase
      .from('meetups')
      .select('*')
      .order('created_at', { ascending: false });

    if (isPast !== undefined) {
      query = query.eq('is_past', isPast === 'true');
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
      console.error('Supabase create meetup error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ meetups: data || [] });
  } catch (error) {
    console.error('Get meetups error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('meetups')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Meetup not found' });
    }

    return res.json({ meetup: data });
  } catch (error) {
    console.error('Get meetup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Create meetup request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    const {
      title,
      description,
      meetup_number,
      location,
      date,
      time,
      organiser,
      organizer,
      insta_link,
      img_url,
      image_url,
      poster_url,
      register_link,
      is_past
    } = req.body;

    const finalOrganiser = organiser || organizer;
    const finalImgUrl = img_url || image_url;

    if (!title || !date || !time || !location || !finalOrganiser) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Normalize meetup_number to integer or null to avoid DB type errors
    let meetupNumberValue = null;
    if (meetup_number !== undefined && meetup_number !== null && meetup_number !== '') {
      const parsed = parseInt(meetup_number, 10);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ error: 'Invalid meetup_number. Must be an integer.' });
      }
      meetupNumberValue = parsed;
    }

    let finalIsPast = false;

    if (typeof is_past === 'boolean') {
      finalIsPast = is_past;
    } else if (typeof is_past === 'string') {
      finalIsPast = is_past === 'true';
    }

    const insertData = {
      title,
      description: description || null,
      meetup_number: meetupNumberValue,
      location,
      date,
      time,
      organiser: finalOrganiser,
      insta_link: insta_link || null,
      img_url: finalImgUrl || null,
      register_link: register_link || null,
      is_past: finalIsPast
    };

    // Only include this field when explicitly passed; many DBs don't have this column.
    if (poster_url !== undefined) {
      insertData.poster_url = poster_url || null;
    }

    let { data, error } = await supabase
      .from('meetups')
      .insert(insertData)
      .select()
      .single();

    // Backward compatibility for older schema using organizer (US spelling)
    if (error?.message?.includes('column "organiser"') && error?.message?.includes('does not exist')) {
      const legacyInsertData = { ...insertData };
      delete legacyInsertData.organiser;
      legacyInsertData.organizer = finalOrganiser;

      const retryResult = await supabase
        .from('meetups')
        .insert(legacyInsertData)
        .select()
        .single();

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase update meetup error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ meetup: data });
  } catch (error) {
    console.error('Create meetup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Update meetup request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });

    const updates = req.body;

    const {
      image_url,
      img_url,
      poster_url,
      register_link,
      insta_link,
      organiser,
      organizer,
      ...rest
    } = updates;

    const updateData = { ...rest };

    const finalOrganiser = organiser || organizer;
    const finalImgUrl = img_url || image_url;

    if (finalOrganiser !== undefined) {
      updateData.organiser = finalOrganiser;
    }

    if (finalImgUrl !== undefined) {
      updateData.img_url = finalImgUrl;
    }

    if (poster_url !== undefined) {
      updateData.poster_url = poster_url;
    }

    // Normalize meetup_number in updates if provided
    if (updateData.meetup_number !== undefined) {
      const mn = updateData.meetup_number;
      if (mn === null || mn === '') {
        updateData.meetup_number = null;
      } else {
        const parsed = parseInt(mn, 10);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ error: 'Invalid meetup_number in update. Must be an integer.' });
        }
        updateData.meetup_number = parsed;
      }
    }

    if (register_link !== undefined) {
      updateData.register_link = register_link;
    }

    if (insta_link !== undefined) {
      updateData.insta_link = insta_link;
    }

    delete updateData.id;

    let { data, error } = await supabase
      .from('meetups')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    // Backward compatibility for older schema using organizer (US spelling)
    if (error?.message?.includes('column "organiser"') && error?.message?.includes('does not exist') && updateData.organiser !== undefined) {
      const legacyUpdateData = { ...updateData };
      legacyUpdateData.organizer = legacyUpdateData.organiser;
      delete legacyUpdateData.organiser;

      const retryResult = await supabase
        .from('meetups')
        .update(legacyUpdateData)
        .eq('id', req.params.id)
        .select()
        .single();

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Meetup not found' });
    }

    return res.json({ meetup: data });
  } catch (error) {
    console.error('Update meetup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('meetups')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ message: 'Meetup deleted successfully' });
  } catch (error) {
    console.error('Delete meetup error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
