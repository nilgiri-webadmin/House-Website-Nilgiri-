import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/', async (req, res) => {
    try {
        const [communities, events, meetups, council, achievements] = await Promise.all([
            supabase.from('communities').select('*', { count: 'exact', head: true }),
            supabase.from('events').select('*', { count: 'exact', head: true }),
            supabase.from('meetups').select('*', { count: 'exact', head: true }),
            supabase.from('council_members').select('*', { count: 'exact', head: true }),
            supabase.from('achievements').select('*', { count: 'exact', head: true })
        ]);

        res.json({
            members: 5500 + (council.count || 0), // Base plus council
            communities: communities.count || 0,
            events: events.count || 0,
            meetups: meetups.count || 0,
            achievements: achievements.count || 0,
            alumni: 50 // Still static as we might not have alumni table
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
