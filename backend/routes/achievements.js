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
    const { limit, category } = req.query;

    let query = supabase
      .from('achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Achievements GET error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Achievements fetched:', data?.length || 0);
    res.json(data || []);
  } catch (error) {
    console.error('❌ Achievements exception:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Create achievement request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    const { student_name, title, description, date, category, image } = req.body;

    if (!student_name || !title) {
      return res.status(400).json({
        error: 'student_name and title are required'
      });
    }

    const insertData = {
      student_name,
      title,
      description: description || null,
      date: date || null,
      category: category || null
    };

    if (image !== undefined) insertData.image = image || null;

    let { data, error } = await supabase
      .from('achievements')
      .insert([insertData])
      .select();

    if (error?.message?.includes('column "image"') && error?.message?.includes('does not exist')) {
      const legacyInsertData = { ...insertData };
      if (legacyInsertData.image !== undefined) {
        legacyInsertData.img_url = legacyInsertData.image;
        delete legacyInsertData.image;
      }
      const retryResult = await supabase.from('achievements').insert([legacyInsertData]).select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase create achievement error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Update achievement request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    const { student_name, title, description, date, category, image } = req.body;

    const updateData = {
      student_name,
      title,
      description,
      date,
      category
    };

    if (image !== undefined) updateData.image = image;

    let { data, error } = await supabase
      .from('achievements')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error?.message?.includes('column "image"') && error?.message?.includes('does not exist')) {
      const legacyUpdateData = { ...updateData };
      if (legacyUpdateData.image !== undefined) {
        legacyUpdateData.img_url = legacyUpdateData.image;
        delete legacyUpdateData.image;
      }
      const retryResult = await supabase
        .from('achievements')
        .update(legacyUpdateData)
        .eq('id', req.params.id)
        .select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase update achievement error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Achievement not found' });
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('achievements')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

