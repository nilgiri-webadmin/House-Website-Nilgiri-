import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireClubAdmin } from '../middleware/auth.js';

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple in-memory cache (use Redis in production)
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL
  });
}

// GET /api/communities - Get all communities
router.get('/', async (req, res) => {
  try {
    const useCache = req.query.cache === 'true';
    const cacheKey = 'all_communities';

    // Check cache first
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) {
        console.log('✅ Cache hit - returning cached communities');
        return res.set('X-Cache', 'HIT').json(cached);
      }
    }

    console.log('📊 Cache miss - querying database');
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Store in cache
    setCached(cacheKey, data || []);

    res.set('X-Cache', 'MISS').json(data || []);
  } catch (error) {
    console.error('Get communities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/communities/:id - Get single community with events
router.get('/:id', async (req, res) => {
  try {
    // Get community data
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (communityError || !community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Parse events field and fetch event details
    let eventsData = [];
    if (community.events) {
      try {
        // Handle deeply nested stringified JSON
        let eventIds = community.events;
        let parseAttempts = 0;
        const maxAttempts = 10;

        while (typeof eventIds === 'string' && parseAttempts < maxAttempts) {
          try {
            eventIds = JSON.parse(eventIds);
            parseAttempts++;
          } catch (e) {
            console.error(`JSON parse failed at attempt ${parseAttempts}:`, e.message);
            break;
          }
        }

        // Recursively flatten and parse array elements that might still be stringified
        const flattenEventIds = (arr) => {
          const result = [];
          if (Array.isArray(arr)) {
            arr.forEach(item => {
              if (typeof item === 'string') {
                try {
                  const parsed = JSON.parse(item);
                  if (Array.isArray(parsed)) {
                    result.push(...flattenEventIds(parsed));
                  } else {
                    result.push(parsed);
                  }
                } catch {
                  // If it's a string UUID, add it directly
                  if (item.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                    result.push(item);
                  }
                }
              } else if (Array.isArray(item)) {
                result.push(...flattenEventIds(item));
              } else {
                result.push(item);
              }
            });
          }
          return result;
        };

        // Flatten the array and filter for valid UUIDs
        const flatIds = Array.isArray(eventIds) ? flattenEventIds(eventIds) : [];
        const validUuids = flatIds.filter(id => 
          typeof id === 'string' && 
          id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
        );

        console.log(`Events for community ${req.params.id}: Found ${validUuids.length} valid event IDs`);

        // Fetch event details if there are valid event IDs
        if (validUuids.length > 0) {
          const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, date, location, img_url, image_url')
            .in('id', validUuids);

          if (!eventsError && events) {
            eventsData = events.map(evt => ({
              ...evt,
              image: evt.img_url || evt.image_url
            }));
          }
        }
      } catch (parseError) {
        console.error('Error parsing events:', parseError);
      }
    }

    res.json({
      ...community,
      events: eventsData
    });
  } catch (error) {
    console.error('Get community error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/communities - Create new community (admin only)
router.post('/', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Create community request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    // TODO: Add authentication check
    const { name, description, lead, joining_form, events, image, instagram } = req.body;

    if (!name || !description || !lead) {
      return res.status(400).json({
        error: 'Name, description, and lead are required'
      });
    }

    const insertData = {
      name,
      description,
      lead,
      joining_form,
      events: events || null,
      instagram: instagram || null,
      created_at: new Date().toISOString()
    };

    if (image !== undefined) insertData.image = image || null;

    let { data, error } = await supabase
      .from('communities')
      .insert([insertData])
      .select();

    if (error?.message?.includes('column "image"') && error?.message?.includes('does not exist')) {
      const legacyInsertData = { ...insertData };
      if (legacyInsertData.image !== undefined) {
        legacyInsertData.image_url = legacyInsertData.image;
        delete legacyInsertData.image;
      }
      const retryResult = await supabase.from('communities').insert([legacyInsertData]).select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase create community error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Invalidate cache
    cache.delete('all_communities');

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Create community error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/communities/:id - Update community (admin only)
router.put('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    console.log('📥 Update community request body:', req.body);
    console.log('👤 Authenticated user:', req.user && { id: req.user.id || req.user.userId, role: req.user.role });
    // TODO: Add authentication check
    const { name, description, lead, joining_form, events, image, instagram } = req.body;

    const updateData = {
      name,
      description,
      lead,
      joining_form,
      events,
      instagram,
      updated_at: new Date().toISOString()
    };

    if (image !== undefined) updateData.image = image;

    let { data, error } = await supabase
      .from('communities')
      .update(updateData)
      .eq('id', req.params.id)
      .select();

    if (error?.message?.includes('column "image"') && error?.message?.includes('does not exist')) {
      const legacyUpdateData = { ...updateData };
      if (legacyUpdateData.image !== undefined) {
        legacyUpdateData.image_url = legacyUpdateData.image;
        delete legacyUpdateData.image;
      }
      const retryResult = await supabase
        .from('communities')
        .update(legacyUpdateData)
        .eq('id', req.params.id)
        .select();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error('Supabase update community error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Invalidate cache
    cache.delete('all_communities');

    res.json(data[0]);
  } catch (error) {
    console.error('Update community error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/communities/:id - Delete community (admin only)
router.delete('/:id', authenticateToken, requireClubAdmin, async (req, res) => {
  try {
    // TODO: Add authentication check
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Invalidate cache
    cache.delete('all_communities');

    res.status(204).send();
  } catch (error) {
    console.error('Delete community error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
