import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/complaints - Get all complaints
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        let query = supabase.from('complaints').select('*').order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/complaints - Create a complaint
router.post('/', async (req, res) => {
    try {
        const { title, description } = req.body;
        console.log('📥 Create complaint request body:', req.body);

        const insertData = {
            title,
            description,
            status: 'pending',
            created_at: new Date().toISOString()
        };

        let { data, error } = await supabase
            .from('complaints')
            .insert([insertData])
            .select();

        if (error) {
            console.error('Supabase create complaint error:', error);
        }

        if (error) return res.status(500).json({ error: error.message });
        res.status(201).json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PATCH /api/complaints/:id - Update status
router.patch('/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        console.log('📥 Update complaint request body:', req.body);

        const { data, error } = await supabase
            .from('complaints')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', req.params.id)
            .select();

        if (error) {
            console.error('Supabase update complaint error:', error);
        }

        if (error) return res.status(500).json({ error: error.message });
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
